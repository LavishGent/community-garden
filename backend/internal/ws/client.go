package ws

import (
	"community-garden/backend/internal/engine"
	"encoding/json"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub    *Hub
	engine chan<- engine.Event
	conn   *websocket.Conn
	send   chan []byte
}

func NewClient(hub *Hub, engine chan<- engine.Event, conn *websocket.Conn) *Client {
	return &Client{
		hub:    hub,
		engine: engine,
		conn:   conn,
		send:   make(chan []byte, 256), // buffered channel to hold messages to send to the client, not sure what the best size is at the moment
	}
}

// read from socket and send events to the engine
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		//parse message into event
		var incoming struct {
			Type    engine.EventType `json:"type"`
			PlotID  string           `json:"plotId"`
			Version int              `json:"version"`
		}
		if err := json.Unmarshal(message, &incoming); err != nil {
			// handle error, maybe send error back to client?
			continue
		}

		// channel for engine to reply with errors
		reply := make(chan []byte, 1) //only needs a buffer of 1 since engine will only send one response per event

		//send event to engine
		c.engine <- engine.Event{
			Type:    incoming.Type,
			PlotID:  incoming.PlotID,
			Version: incoming.Version,
			Reply:   reply,
		}

		// listen for error in background
		go func() {
			if errMsg, ok := <-reply; ok {
				c.send <- errMsg
			}
		}()
	}
}

// write messages from the hub to the socket
func (c *Client) writePump() {
	defer c.conn.Close()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
}
