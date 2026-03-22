package main

import (
	"flag"
	"log"
	"net/http"

	"community-garden/backend/internal/engine"
	"community-garden/backend/internal/ws"
)

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	flag.Parse()
	// Initialize Hub
	hub := ws.NewHub()

	// Initialize Engine
	gardenEngine := engine.NewGardenEngine(hub.Broadcast())

	// start hub
	go hub.Run()
	// start engine loop
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