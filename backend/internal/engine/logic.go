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

	// Health decay logic
	healthDecay := 0.0
	if p.Hydration <= 0 {
		healthDecay += 1.0 // Dries out
	} else if p.Hydration < 20 {
		healthDecay += 0.2 // Starting to dry
	}

	if p.Weeds >= 50 {
		healthDecay += 0.3 // Choked by weeds
	}
	if p.Weeds >= 80 {
		healthDecay += 0.7 // Seriously choked
	}

	if healthDecay > 0 {
		p.Health = clamp(p.Health-healthDecay, 0, 100)
	} else {
		// Recovery if conditions are good
		if p.Hydration > 80 && p.Weeds < 10 {
			p.Health = clamp(p.Health+0.5, 0, 100)
		}
	}

	if p.Health > 0 && p.Hydration > 0 {
		// Growth is restricted by health, hydration, and weeds
		// 1. Health multiplier (0.0 - 1.0)
		healthMult := p.Health / 100.0

		// 2. Hydration multiplier: Growth slows significantly as it dries
		// Below 20% hydration, growth drops off sharply
		hydrationMult := p.Hydration / 100.0
		if p.Hydration < 20 {
			hydrationMult = (p.Hydration / 20.0) * 0.2 // Non-linear drop
		}

		// 3. Weed penalty: High weeds choke the plant
		weedPenalty := 1.0
		if p.Weeds > 30 {
			weedPenalty = clamp(1.0-((p.Weeds-30)/70.0), 0.1, 1.0)
		}

		totalMultiplier := healthMult * hydrationMult * weedPenalty
		p.Growth = clamp(p.Growth+cropProfile.GrowthRate*totalMultiplier, 0, 100)
	}
}

func handleWater(p *Plot) {
	if p.Hydration == 100 || p.Health == 0 {
		return
	}
	p.Hydration = clamp(p.Hydration+20, 0, 100)
}

func handleWeed(p *Plot) {
	if p.Weeds == 0 || p.Health == 0 {
		return
	}
	p.Weeds = clamp(p.Weeds-10, 0, 100)
}

func handlePlant(p *Plot, crop *CropType) error {
	// Allow planting on a dead plot — clears the dead crop first
	if p.Occupied && p.Health > 0 {
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

func (e *GardenEngine) handleRemove(p *Plot) error {
	if !p.Occupied {
		return errors.New("plot_not_occupied")
	}
	if p.Health > 0 {
		return errors.New("crop_not_dead")
	}
	p.Occupied = false
	p.Crop = None
	p.Growth = 0
	p.Weeds = 0
	p.Health = 50
	p.Hydration = 50
	return nil
}

func (e *GardenEngine) handleHarvest(p *Plot) error {
	if !p.Occupied {
		return errors.New("plot_not_occupied")
	}
	if p.Health == 0 {
		return errors.New("crop_dead")
	}
	if p.Growth != 100 {
		return errors.New("crop_not_ready")
	}
	cropProfile := CropConfig[p.Crop]

	e.garden.Score += cropProfile.HarvestScore
	p.Occupied = false
	p.Crop = None
	p.Growth = 0
	p.Weeds = 0
	p.Health = 100
	return nil
}
