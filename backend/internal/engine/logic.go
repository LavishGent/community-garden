package engine

import (
	"errors"
)

// Potentially could be extracted to it's own package but part of PoC we're leaving it in the engine

//applyDecay
//handleWater
//handleWeed
//handlePlant

//custom clamp function to clamp values between 0 and 100
func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func  applyDecay(p *Plot) {
	p.Hydration = clamp(p.Hydration - 0.2, 0, 100)
	p.Weeds = clamp(p.Weeds + 0.1, 0, 100)
	//TODO: basic health decay formula, should be adjusted
	p.Health = clamp(p.Health - p.Weeds, 0, 100)
}

func handleWater(p *Plot) {
	p.Hydration = clamp(p.Hydration + 5, 0, 100)
	p.Health = clamp(p.Health - p.Weeds, 0, 100)
}

func handleWeed(p *Plot) {
	p.Weeds = clamp(p.Weeds - 2, 0, 100)
	p.Health = clamp(p.Health - p.Weeds, 0, 100)
}

func handlePlant(p *Plot) error {
	if p.Occupied {
		return errors.New("plot_occupied")
	}
	p.Occupied = true
	return nil
}