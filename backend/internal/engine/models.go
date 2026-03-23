package engine

// Potentially could be extracted to it's own package but part of PoC we're leaving it in the engine

import (
	"fmt"
)

type CropType string

const (
	None       CropType = "NONE"
	Corn       CropType = "CORN"
	Wheat      CropType = "WHEAT"
	Cotton     CropType = "COTTON"
	Strawberry CropType = "STRAWBERRY"
)

type CropProfile struct {
	ThirstRate         float64
	WeedSusceptibility float64
	GrowthRate         float64
}

var CropConfig = map[CropType]CropProfile{
	Corn: {
		ThirstRate:         0.5,
		WeedSusceptibility: 0.1,
		GrowthRate:         0.8,
	},
	Wheat: {
		ThirstRate:         0.1,
		WeedSusceptibility: 0.05,
		GrowthRate:         0.4,
	},
	Cotton: {
		ThirstRate:         0.2,
		WeedSusceptibility: 0.25,
		GrowthRate:         0.4,
	},
	Strawberry: {
		ThirstRate:         0.6,
		WeedSusceptibility: 0.4,
		GrowthRate:         1.2,
	},
}

type Plot struct {
	ID        string   `json:"id"`
	Crop      CropType `json:"crop"`
	Growth    float64  `json:"growth"`
	Hydration float64  `json:"hydration"`
	Weeds     float64  `json:"weeds"`
	Occupied  bool     `json:"occupied"`
	Health    float64  `json:"health"`
	Version   int      `json:"version"`
}

type Garden struct {
	Plots map[string]*Plot `json:"plots"`
}

func NewGarden() *Garden {
	plots := make(map[string]*Plot)
	// rows are the letters and columns are the numbers
	rows := []string{"A", "B", "C", "D", "E"}
	for _, row := range rows {
		for col := 1; col <= 5; col++ {
			id := fmt.Sprintf("%s%d", row, col)
			plots[id] = &Plot{
				ID:        id,
				Crop:      None,
				Growth:    0,
				Hydration: 50,
				Weeds:     0,
				Health:    50,
			}
		}
	}
	return &Garden{Plots: plots}
}

type EventType string

const (
	Water   EventType = "WATER"
	Weed    EventType = "WEED"
	Plant   EventType = "PLANT"
	Harvest EventType = "HARVEST"
)

type Event struct {
	Type    EventType     `json:"type"`
	PlotID  string        `json:"plotId"`
	Crop    CropType      `json:"crop"`
	Version int           `json:"version"`
	Reply   chan<- []byte // chan<- means the engine can only send to this channel, not receive
}
