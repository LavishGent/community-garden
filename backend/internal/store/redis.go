package store

import (
	"context"
	"errors"

	"github.com/redis/go-redis/v9"
)

const (
	gardenStateKey     = "garden:state"
	gardenStateChannel = "garden:state:broadcast"
)

type RedisStore struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisStore(redisURL string) (*RedisStore, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opts)
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, err
	}
	return &RedisStore{client: client, ctx: ctx}, nil
}

func (s *RedisStore) SaveState(data []byte) error {
	return s.client.Set(s.ctx, gardenStateKey, data, 0).Err()
}

func (s *RedisStore) LoadState() ([]byte, error) {
	val, err := s.client.Get(s.ctx, gardenStateKey).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	return val, err
}

func (s *RedisStore) Publish(data []byte) error {
	return s.client.Publish(s.ctx, gardenStateChannel, string(data)).Err()
}

// Subscribe returns a channel that emits raw state payloads published by other VMs.
// The channel is closed when ctx is cancelled.
func (s *RedisStore) Subscribe(ctx context.Context) <-chan []byte {
	ch := make(chan []byte, 64)
	pubsub := s.client.Subscribe(ctx, gardenStateChannel)
	go func() {
		defer close(ch)
		msgCh := pubsub.Channel()
		for {
			select {
			case msg, ok := <-msgCh:
				if !ok {
					return
				}
				ch <- []byte(msg.Payload)
			case <-ctx.Done():
				pubsub.Close()
				return
			}
		}
	}()
	return ch
}

func (s *RedisStore) Close() error {
	return s.client.Close()
}
