package engine

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"community-garden/backend/internal/store"
)

type GardenEngine struct {
	garden    *Garden
	events    chan Event
	broadcast chan<- []byte
	store     *store.RedisStore
	external  chan []byte
}

func NewGardenEngine(broadcast chan<- []byte, redisStore *store.RedisStore) *GardenEngine {
	e := &GardenEngine{
		garden:    NewGarden(),
		events:    make(chan Event, 50),
		broadcast: broadcast,
		store:     redisStore,
		external:  make(chan []byte, 16),
	}
	if redisStore != nil {
		if data, err := redisStore.LoadState(); err == nil && data != nil {
			var garden Garden
			if err := json.Unmarshal(data, &garden); err == nil {
				e.garden = &garden
				log.Println("Loaded garden state from Redis")
			}
		}
	}
	return e
}

func (e *GardenEngine) Events() chan<- Event {
	return e.events
}

func (e *GardenEngine) applyDecayAll() {
	for _, plot := range e.garden.Plots {
		applyDecay(plot)
	}
}

func (e *GardenEngine) BroadcastState() {
	msg := map[string]interface{}{
		"type":   "STATE",
		"garden": e.garden,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	e.broadcast <- data
}

func (e *GardenEngine) persistState() {
	if e.store == nil {
		return
	}
	e.garden.Version++
	data, err := json.Marshal(e.garden)
	if err != nil {
		return
	}
	if err := e.store.SaveState(data); err != nil {
		log.Println("Redis save error:", err)
	}
	if err := e.store.Publish(data); err != nil {
		log.Println("Redis publish error:", err)
	}
}

func (e *GardenEngine) applyExternalState(data []byte) {
	var incoming Garden
	if err := json.Unmarshal(data, &incoming); err != nil {
		return
	}
	if incoming.Version > e.garden.Version {
		e.garden = &incoming
	}
}

func (e *GardenEngine) subscribeExternal(ctx context.Context) {
	for data := range e.store.Subscribe(ctx) {
		e.external <- data
	}
}

func (e *GardenEngine) handleEvent(event Event) {
	plot, exist := e.garden.Plots[event.PlotID]
	if !exist {
		e.SendError(event.Reply, "plot doesn't exist")
		return
	}
	if plot.Version != event.Version {
		e.SendError(event.Reply, "plot version mismatch")
		return
	}
	var err error
	switch event.Type {
	case Water:
		handleWater(plot)
	case Weed:
		handleWeed(plot)
	case Plant:
		err = handlePlant(plot, &event.Crop)
	case Harvest:
		err = e.handleHarvest(plot)
	case Remove:
		err = e.handleRemove(plot)
	default:
		e.SendError(event.Reply, "event type not found")
		return
	}
	if err != nil {
		e.SendError(event.Reply, err.Error())
		return
	}

	plot.Version++
}

func (e *GardenEngine) SendError(reply chan<- []byte, errMsg string) {
	if reply == nil {
		return
	}
	data, _ := json.Marshal(map[string]string{
		"type":    "ERROR",
		"message": errMsg,
	})
	reply <- data
}

func (e *GardenEngine) Run() {
	broadcastTicker := time.NewTicker(1 * time.Millisecond)
	decayTicker := time.NewTicker(1 * time.Second)
	saveTicker := time.NewTicker(30 * time.Second)

	if e.store != nil {
		go e.subscribeExternal(context.Background())
	}

	for {
		select {
		case event := <-e.events:
			e.handleEvent(event)
			e.persistState()
		case <-decayTicker.C:
			e.applyDecayAll()
		case <-saveTicker.C:
			e.persistState()
		case <-broadcastTicker.C:
			e.BroadcastState()
		case data := <-e.external:
			e.applyExternalState(data)
		}
	}
}
