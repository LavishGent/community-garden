package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"community-garden/backend/internal/engine"
	"community-garden/backend/internal/store"
	"community-garden/backend/internal/ws"
)

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	flag.Parse()

	// Initialize Hub
	hub := ws.NewHub()

	// Initialize Redis store if REDIS_URL is set
	var redisStore *store.RedisStore
	if redisURL := os.Getenv("REDIS_URL"); redisURL != "" {
		var err error
		redisStore, err = store.NewRedisStore(redisURL)
		if err != nil {
			log.Fatalf("Failed to connect to Redis: %v", err)
		}
		defer redisStore.Close()
		log.Println("Connected to Redis")
	} else {
		log.Println("REDIS_URL not set — running with in-memory state only")
	}

	// Initialize Engine
	gardenEngine := engine.NewGardenEngine(hub.Broadcast(), redisStore)

	// Start hub
	go hub.Run()
	// Start engine loop
	go gardenEngine.Run()

	// Define Websocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hub, gardenEngine.Events(), w, r)
	})

	// Start the Http Server
	log.Println("Garden Server started on ", *addr)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("Could not start server: ", err)
	}
}