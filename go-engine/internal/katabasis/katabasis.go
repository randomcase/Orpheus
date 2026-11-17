// Package katabasis models Orpheus's ascent from the Underworld as an idiomatic
// Go concurrency contract using goroutines, forward-only directional channels,
// and context cancellation upon violating Motif C331 (looking back).
package katabasis

import (
	"context"
	"fmt"
	"sync"
	"time"
)

const (
	OutcomeReunited = "REUNITED_IN_LIGHT"
	OutcomeRelapsed = "RELAPSA_INTO_AVERNO"
)

// StepEvent represents a single transmitted stage during the Underworld ascent.
type StepEvent struct {
	Step       int    `json:"step"`
	TotalSteps int    `json:"total_steps"`
	Actor      string `json:"actor"`
	Phase      string `json:"phase"`
	Message    string `json:"message"`
	TabooIntact bool  `json:"taboo_intact"`
}

// SimulationResult summarizes the completed or canceled Katabasis execution.
type SimulationResult struct {
	StepsRequested int         `json:"steps_requested"`
	LookBackAtStep int         `json:"look_back_at_step"`
	Outcome        string      `json:"outcome"`
	Hamartia       string      `json:"hamartia,omitempty"`
	DurationMicros int64       `json:"duration_micros"`
	Events         []StepEvent `json:"events"`
}

// RunSimulation coordinates separate Orpheus and Eurydice goroutines over a
// forward-only channel (chan<- StepEvent). If 1 <= lookBackAtStep <= steps,
// Orpheus cancels the ascent context before reaching upper daylight.
func RunSimulation(steps int, lookBackAtStep int) SimulationResult {
	if steps < 3 {
		steps = 3
	}
	if steps > 30 {
		steps = 30
	}

	start := time.Now()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ascentCh := make(chan StepEvent, steps*2+4)
	orpheusStep := make(chan int)
	eurydiceAck := make(chan bool)

	var wg sync.WaitGroup
	wg.Add(2)

	// Eurydice goroutine: trails Orpheus step-for-step until sunlight or context cancellation.
	go func(out chan<- StepEvent) {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				out <- StepEvent{
					Step:        lookBackAtStep,
					TotalSteps:  steps,
					Actor:       "Eurydice",
					Phase:       "Relapsa",
					Message:     "\"Vale\" — drawn back into Averno the instant the forward contract broke.",
					TabooIntact: false,
				}
				return
			case step, ok := <-orpheusStep:
				if !ok {
					out <- StepEvent{
						Step:        steps,
						TotalSteps:  steps,
						Actor:       "Eurydice",
						Phase:       "Superas_Auras",
						Message:     "Crosses completely into upper sunlight; the covenant holds.",
						TabooIntact: true,
					}
					return
				}
				out <- StepEvent{
					Step:        step,
					TotalSteps:  steps,
					Actor:       "Eurydice",
					Phase:       "Following_In_Dark",
					Message:     fmt.Sprintf("Steps quietly behind Orpheus (%d/%d) on wounded ankle.", step, steps),
					TabooIntact: true,
				}
				select {
				case eurydiceAck <- true:
				case <-ctx.Done():
					out <- StepEvent{
						Step:        step,
						TotalSteps:  steps,
						Actor:       "Eurydice",
						Phase:       "Relapsa",
						Message:     "\"Vale\" — slips back through yielding air before crossing the threshold.",
						TabooIntact: false,
					}
					return
				}
			}
		}
	}(ascentCh)

	// Orpheus goroutine: walks forward holding a one-way ascent channel.
	go func(out chan<- StepEvent) {
		defer wg.Done()
		out <- StepEvent{
			Step:        0,
			TotalSteps:  steps,
			Actor:       "Hades & Persephone",
			Phase:       "Pact_Sealed",
			Message:     "Forward-only channel granted: keep eyes ahead until both enter daylight.",
			TabooIntact: true,
		}

		for step := 1; step <= steps; step++ {
			if lookBackAtStep >= 1 && step == lookBackAtStep {
				out <- StepEvent{
					Step:        step,
					TotalSteps:  steps,
					Actor:       "Orpheus",
					Phase:       "Respexit",
					Message:     fmt.Sprintf("Turns backward at step %d/%d out of anxious love, canceling ctx.", step, steps),
					TabooIntact: false,
				}
				cancel()
				return
			}

			out <- StepEvent{
				Step:        step,
				TotalSteps:  steps,
				Actor:       "Orpheus",
				Phase:       "Ascent",
				Message:     fmt.Sprintf("Climbs blind toward upper air (%d/%d) without looking back.", step, steps),
				TabooIntact: true,
			}

			select {
			case orpheusStep <- step:
			case <-ctx.Done():
				return
			}

			select {
			case <-eurydiceAck:
			case <-ctx.Done():
				return
			}
		}

		close(orpheusStep)
		out <- StepEvent{
			Step:        steps,
			TotalSteps:  steps,
			Actor:       "Orpheus",
			Phase:       "Sunlight",
			Message:     "Enters open daylight first and waits until Eurydice clears the cave.",
			TabooIntact: true,
		}
	}(ascentCh)

	wg.Wait()
	close(ascentCh)

	events := make([]StepEvent, 0, len(ascentCh))
	for ev := range ascentCh {
		events = append(events, ev)
	}

	outcome := OutcomeReunited
	hamartia := ""
	if lookBackAtStep >= 1 && lookBackAtStep <= steps {
		outcome = OutcomeRelapsed
		hamartia = fmt.Sprintf("Motif C331 violated at step %d of %d (context canceled before threshold)", lookBackAtStep, steps)
	}

	return SimulationResult{
		StepsRequested: steps,
		LookBackAtStep: lookBackAtStep,
		Outcome:        outcome,
		Hamartia:       hamartia,
		DurationMicros: time.Since(start).Microseconds(),
		Events:         events,
	}
}
