package ws

import (
	"community-garden/backend/internal/engine"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // allow all origins for now
	},
}

func ServeWs(hub *Hub, engine chan<- engine.Event, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		// handle error
		return
	}

	client := NewClient(hub, engine, conn)
	client.hub.register <- client

	// start goroutines for reading and writing
	go client.readPump()
	go client.writePump()
}