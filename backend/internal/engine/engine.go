package engine

import (
	"encoding/json"
	"time"
)

type GardenEngine struct {
	garden    *Garden
	events    chan Event
	broadcast chan<- []byte
}

func NewGardenEngine(broadcast chan<- []byte) *GardenEngine {
	return &GardenEngine{
		garden:    NewGarden(),
		events:    make(chan Event, 50), // buffered channel to hold events, not sure what the best size is at the moment
		broadcast: broadcast,
	}
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
		// handle error
		return
	}
	e.broadcast <- data
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
	//switch case on event type
	switch event.Type {
	case Water:
		handleWater(plot)
	case Weed:
		handleWeed(plot)
	case Plant:
		err = handlePlant(plot, &event.Crop)
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
	ticker := time.NewTicker(100 * time.Millisecond)
	for {
		select {
		case event := <-e.events:
			e.handleEvent(event)
		case <-ticker.C:
			e.applyDecayAll()
			//broadcast the updated garden state to all clients
			e.BroadcastState()
		}
	}
}
