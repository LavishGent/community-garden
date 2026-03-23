package engine

import (
	"errors"
)

// Potentially could be extracted to it's own package but part of PoC we're leaving it in the engine

// custom clamp function to clamp values between 0 and 100
func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func applyDecay(p *Plot) {
	if !p.Occupied {
		return
	}
	cropProfile := CropConfig[p.Crop]

	p.Hydration = clamp(p.Hydration-cropProfile.ThirstRate, 0, 100)
	p.Weeds = clamp(p.Weeds+cropProfile.WeedSusceptibility, 0, 100)
	//TODO: basic health decay formula, should be adjusted
	p.Health = clamp(p.Hydration-p.Weeds, 0, 100)
	if p.Health > 0 {
		p.Growth = clamp(p.Growth+cropProfile.GrowthRate, 0, 100)
	}
}

func handleWater(p *Plot) {
	if p.Hydration == 100 {
		return
	}
	p.Hydration = clamp(p.Hydration+20, 0, 100)
	p.Health = clamp(p.Hydration-p.Weeds, 0, 100)
}

func handleWeed(p *Plot) {
	if p.Weeds == 0 {
		return
	}
	p.Weeds = clamp(p.Weeds-2, 0, 100)
	p.Health = clamp(p.Hydration-p.Weeds, 0, 100)
}

func handlePlant(p *Plot, crop *CropType) error {
	if p.Occupied || p.Crop != None {
		return errors.New("plot_occupied")
	}
	p.Crop = *crop
	p.Growth = 0
	p.Occupied = true
	p.Hydration = 100
	p.Weeds = 0
	p.Health = 100
	return nil
}

func handleHarvest(p *Plot) error {
	if !p.Occupied {
		return errors.New("plot_not_occupied")
	}
	if p.Growth != 100 {
		return errors.New("crop_not_ready")
	}
	p.Occupied = false
	p.Crop = None
	p.Growth = 0
	p.Weeds = 0
	p.Health = 100
	return nil
}
