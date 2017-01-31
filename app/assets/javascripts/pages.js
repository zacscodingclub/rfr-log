'use strict';
console.clear();

var intervalTimerMain = function() {
    var bitOnFillColor  = '#50C6D9';
	var bitOffFillColor = '#092629';

	var countDirDown = 0;
	var countDirUp   = 1;

	var INTERVAL_WARM = "warm";
	var INTERVAL_COOL = "cool";
	var INTERVAL_WORK = "work";
	var INTERVAL_REST = "rest";

	var digit_layout  = [
		[ 1, 0, 1, 1, 1, 1, 1 ], // digit 0
		[ 0, 0, 0, 0, 1, 0, 1 ], // digit 1
		[ 1, 1, 1, 0, 1, 1, 0 ], // digit 2
		[ 1, 1, 1, 0, 1, 0, 1 ], // digit 3
		[ 0, 1, 0, 1, 1, 0, 1 ], // digit 4
		[ 1, 1, 1, 1, 0, 0, 1 ], // digit 5
		[ 1, 1, 1, 1, 0, 1, 1 ], // digit 6
		[ 1, 0, 0, 0, 1, 0, 1 ], // digit 7
		[ 1, 1, 1, 1, 1, 1, 1 ], // digit 8
		[ 1, 1, 1, 1, 1, 0, 1 ]  // digit 9
	];


	//=============================================================================
	// toHHMMSS()
	//     - converts a numerical string representing a number of seconds into
	//       a string in the format MM:SS.
	//=============================================================================

	String.prototype.toMMSS = function () {
	    var numSeconds = parseInt( this, 10 );

	    var minutes = Math.floor( numSeconds / 60 );
	    var seconds = numSeconds - ( minutes * 60 );

	    if ( minutes < 10 ) { minutes = "0" + minutes; }
	    if ( seconds < 10 ) { seconds = "0" + seconds; }
	    var time    = minutes+':'+seconds;

	    return time;
	}

	//=============================================================================
	// TIMER CLASS
	//=============================================================================

	var DigitalClockInput = function( timerInput, minusBtn, plusBtn, maxSeconds ) {
		var self = this;

		this.timerInput = $(timerInput);
		this.minusBtn   = $(minusBtn);
		this.plusBtn    = $(plusBtn);
		this.maxSeconds = maxSeconds;

		this.secondCount = 0;
		this.secondStepCount = 15;

		// SetInput the plus and minus button event handlers.
		this.minusBtn.click( function() {
			self.secondCount -= self.secondStepCount;
			if( self.secondCount < 0 ) {self.secondCount = 0;}
			self.timerInput.val( self.secondCount.toString().toMMSS() );
			self.timerInput.change(); // Trigger change() event.
		});

		this.plusBtn.click( function() {
			self.secondCount += self.secondStepCount;
			if( self.secondCount > self.maxSeconds ) {self.secondCount = self.maxSeconds;}
			self.timerInput.val( self.secondCount.toString().toMMSS() );
			self.timerInput.change(); // Trigger change() event.
		});
	};

	DigitalClockInput.prototype.setTimerStepCount = function(amount) {
		this.secondStepCount = amount;
		if( this.secondStepCount <= 0 ) { this.secondStepCount = 1; }
	};

	DigitalClockInput.prototype.getTime = function() {
		return this.secondCount;
	};

	//=============================================================================
	// SET CLASS
	//=============================================================================

	var SetInput = function( setInput, minusBtn, plusBtn, maxSets ) {
		var self = this;

		this.setInput = $(setInput);
		this.minusBtn = $(minusBtn);
		this.plusBtn  = $(plusBtn);
		this.maxSets  = maxSets;

		this.numSets = 1;

		this.minusBtn.click( function(){
			self.numSets--;
			if( self.numSets < 1 ) { self.numSets = 1; }
			self.setInput.val( self.numSets );
			self.setInput.change();
		});

		this.plusBtn.click( function(){
			self.numSets++;
			if( self.numSets > self.maxSets ) { self.numSets = self.maxSets; }
			self.setInput.val( self.numSets );
			self.setInput.change();
		});
	};

	SetInput.prototype.getSets = function() {
		return this.numSets;
	};

	//=============================================================================
	// TOTALTIME CLASS
	//=============================================================================

	var TotalTime = function( totalTimeInput, warmTimerInput, coolTimerInput, workTimerInput, restTimerInput, setInput ) {
		this.totalTimeInput = $(totalTimeInput);

		this.warmTimerInput = warmTimerInput;
		this.coolTimerInput = coolTimerInput;
		this.workTimerInput = workTimerInput;
		this.restTimerInput = restTimerInput;
		this.setInput       = setInput;

		this.totalTime = 0;

		// SetInput up listeners that wait for the timer controls to be updated.
		this.warmTimerInput.timerInput.change( this.update.bind( this ) );
		this.coolTimerInput.timerInput.change( this.update.bind( this ) );
		this.workTimerInput.timerInput.change( this.update.bind( this ) );
		this.restTimerInput.timerInput.change( this.update.bind( this ) );
		this.setInput.setInput.change( this.update.bind( this ) );
	};

	TotalTime.prototype.update = function() {
		var numSets = this.setInput.getSets();
		this.totalTime = this.warmTimerInput.getTime();
		this.totalTime += this.workTimerInput.getTime() * numSets;
		this.totalTime += this.restTimerInput.getTime() * numSets;
		this.totalTime += this.coolTimerInput.getTime();

		this.totalTimeInput.val( this.totalTime.toString().toMMSS() );
	};

	TotalTime.prototype.getTotalTime = function() {
		return this.totalTime;
	};

	//=============================================================================
	// DIGITALCLOCK CLASS
	//=============================================================================

	var DigitalClock = function( clockId, maxSeconds, countDirection ) {

		this.clockId        = clockId;

		this.maxSeconds     = maxSeconds || ( maxSeconds === 0 ? 0 : 35999 );
		this.maxSeconds     = this.maxSeconds > 35999 ? 35999 : this.maxSeconds;
		this.maxSeconds     = this.maxSeconds <= 0 ? 0 : this.maxSeconds;

		this.countDirection = countDirection || countDirDown; // 0 = count down, 1 = count up
		this.numberSeconds  = this.countDirection === countDirUp ? 0 : this.maxSeconds;

		this.setDots( true );
		this.updateClockDisplay();
	}

	DigitalClock.prototype.updateClockDisplay = function() {
		// Digital clock can be minimum 00m00s, and maximum 99h59m.
		if( ( this.numberSeconds < 0 ) || ( this.numberSeconds >= 36000 ) ) {
			this.stopClock();
			this.numberSeconds = ( this.countDirection === countDirUp ) ? this.maxSeconds : 0;
		}

		// Check if the clock has hit either the minimum or maximum boundaries.
		if( this.checkBoundaries() ) {
			this.stopClock();
		}

		// Some aliases for calculations.
		var seconds          = this.numberSeconds;
		var secondsDivBy60   = this.numberSeconds / 60;
		var secondsDivBy600  = this.numberSeconds / 600;
		var secondsDivBy3600 = this.numberSeconds / 3600;

		if( this.numberSeconds < 3600 ) {
			// Digital clock will display MM:SS.
			var digit1 = Math.floor( secondsDivBy600 );
			var digit2 = Math.floor( secondsDivBy60 ) % 10;
			var digit3 = Math.floor( ( seconds - ( Math.floor( secondsDivBy60 ) * 60 ) ) / 10 );
			var digit4 = seconds % 10;
		} else {
			// Digital clock will display HH:MM.
			var digit1 = Math.floor( seconds / 36000 );
			var digit2 = Math.floor( secondsDivBy3600 ) % 10;
			var digit3 = Math.floor( ( ( ( secondsDivBy3600 ) - Math.floor( secondsDivBy3600 ) ) * 60 ) / 10 );
			var digit4 = Math.floor( secondsDivBy60 ) % 10;
		}

		// console.log( 'Total: ' + seconds + '; digit1: ' + digit1 + '; digit2: ' + digit2 +
		// 			 '; digit3: ' + digit3 + '; digit4: ' + digit4 );

		this.setDigit( 1, digit1 );
		this.setDigit( 2, digit2 );
		this.setDigit( 3, digit3 );
		this.setDigit( 4, digit4 );
		this.setTimeIndicators();
	};

	DigitalClock.prototype.startClock = function() {
		var self = this;

		if( this.checkBoundaries() ) { return; }

		// console.log( "start called for clock: " + this.clockId );
		this.clockHandle = setInterval( function(){
			if( self.countDirection === countDirDown ) {
				self.numberSeconds = self.numberSeconds - 1;
			} else {
				self.numberSeconds = self.numberSeconds + 1;
			}
			self.updateClockDisplay();
		}, 1000 );
	};

	DigitalClock.prototype.stopClock = function() {
		// console.log( "stop called for clock: " + this.clockId );
		if( this.clockHandle !== undefined ) {
			clearInterval( this.clockHandle );
			this.clockHandle = undefined;
			this.updateClockDisplay();
		}
	};

	DigitalClock.prototype.resetClock = function() {
		// console.log( "reset called for clock: " + this.clockId );
		if( this.clockHandle !== undefined ) {
			clearInterval( this.clockHandle );
			this.clockHandle = undefined;
		}
		this.numberSeconds = this.countDirection === countDirUp ? 0 : this.maxSeconds;
		this.updateClockDisplay();
	};

	DigitalClock.prototype.setDigit = function( digitIndex, digitNumber ) {
		if( digitIndex < 1 || digitIndex > 4 || digitNumber < 0 || digitNumber > 9 ) {
			return;
		}

		var self  = this;
		var digit = $( this.clockId + " g[data-digital-number='" + digitIndex + "']" ).children();

		digit.each( function( index, elem ) {
			var bitIndex = $(this).data( 'bit' ) - 1;
			if( digit_layout[ digitNumber ][ bitIndex ] === 1 ) {
				$( this ).attr( 'fill', bitOnFillColor );
			} else {
				$( this ).attr( 'fill', bitOffFillColor );
			}
		});
	};

	DigitalClock.prototype.resetDigit = function( digitIndex ) {
		if( digitIndex < 1 || digitIndex > 4 ) {
			return;
		}

		var self  = this;
		var digit = $( this.clockId + " g[data-digital-number='" + digitIndex + "']" ).children();
		digit.each( function( index, elem ) {
			$( this ).attr( 'fill', bitOffFillColor );
		});
	};

	DigitalClock.prototype.setDots = function( isOn ) {
		var dots = $( this.clockId + " g[data-digital-number='dots']" ).children();
		dots.each( function( index, elem ) {
			$(this).attr( 'fill', isOn ? bitOnFillColor : bitOffFillColor )
		});
	};

	DigitalClock.prototype.setTimeIndicators = function() {
		var self = this;
		var timeIndicators = $( this.clockId + ' [data-time-scale]' );

		timeIndicators.each( function( index, elem ) {
			var timeScale = $(this).data( 'time-scale' );

			$(this).attr( 'fill', bitOnFillColor );
			if( self.numberSeconds < 3600 ) {
				if( timeScale === 'minute-hour' ) {
					$(this).text( 'M' );
				}
				if( timeScale === 'second-minute' ) {
					$(this).text( 'S' );
				}
			} else {
				if( timeScale === 'minute-hour' ) {
					$(this).text( 'H' );
				}
				if( timeScale === 'second-minute' ) {
					$(this).text( 'M' );
				}
			}
		});
	};

	DigitalClock.prototype.checkBoundaries = function() {
		// Return false if the current number of seconds passed hasn't hit either 0 or maxSeconds,
		// depending on the direction.
		return ( ( ( this.countDirection === countDirUp ) && ( this.numberSeconds >= this.maxSeconds ) ) ||
			   ( ( this.countDirection === countDirDown ) && ( this.numberSeconds <= 0 ) ) );
	};

	// Use this to manually progress the digital clock. Note: If you use this method, then avoid using the
	// startClock() function.
	DigitalClock.prototype.passOneSecond = function() {

		if( this.checkBoundaries() === false ) {
			if( this.countDirection === countDirUp ) {
				this.numberSeconds += 1;
			} else {
				this.numberSeconds -= 1;
			}
		}

		this.updateClockDisplay();

		return this.numberSeconds;
	};

	DigitalClock.prototype.updateMaxSeconds = function( maxSeconds ) {
		this.maxSeconds     = maxSeconds || ( maxSeconds === 0 ? 0 : 35999 );
		this.maxSeconds     = this.maxSeconds > 35999 ? 35999 : this.maxSeconds;
		this.maxSeconds     = this.maxSeconds <= 0 ? 0 : this.maxSeconds;

		this.resetClock();
	};

	//=============================================================================
	// COUNTER CLASS
	//=============================================================================

	var Counter = function( counterId, maxCount, countDirection ) {
		this.counterId 		= counterId;

		this.maxCount 		= maxCount || ( (maxCount === 0 ) ? 0 : 99 );
		this.maxCount 		= this.maxCount < 0 ? 0 : this.maxCount;
		this.maxCount       = this.maxCount > 99 ? 99 : this.maxCount;

		this.countDirection = countDirection || countDirDown;
		this.currentCount 	= this.countDirection === countDirDown ? this.maxCount : 0;

		this.updateCounterDisplay();
		this.setDivider( true );
	};

	Counter.prototype.updateCounterDisplay = function() {
		var currentCountTens = Math.floor( this.currentCount / 10 );
		var currentCountOnes = this.currentCount % 10;

		var maxCountTens = Math.floor( this.maxCount / 10 );
		var maxCountOnes = this.maxCount % 10;

		// console.log( "Current Count: " + this.currentCount + "; tens: " + currentCountTens + "; ones: " + currentCountOnes );
		// console.log( "Max Count: " + this.maxCount + "; tens: " + maxCountTens + "; ones: " + maxCountOnes );

		this.setDigit( 1, currentCountTens );
		this.setDigit( 2, currentCountOnes );
		this.setDigit( 3, maxCountTens );
		this.setDigit( 4, maxCountOnes );
	};

	Counter.prototype.resetCounter = function() {
		this.currentCount = this.countDirection === countDirDown ? this.maxCount : 0;
		this.updateCounterDisplay();
	};

	Counter.prototype.setDigit = function( digitIndex, digitNumber ) {
		if( digitIndex < 1 || digitIndex > 4 || digitNumber < 0 || digitNumber > 9 ) {
			return;
		}

		var self  = this;
		var digit = $( this.counterId + " g[data-digital-number='" + digitIndex + "']" ).children();
		digit.each( function( index, elem ) {
			var bitIndex = $(this).data( 'bit' ) - 1;
			if( digit_layout[ digitNumber ][ bitIndex ] === 1 ) {
				$( this ).attr( 'fill', bitOnFillColor );
			} else {
				$( this ).attr( 'fill', bitOffFillColor );
			}
		});
	};

	DigitalClock.prototype.resetDigit = function( digitIndex ) {
		if( digitIndex < 1 || digitIndex > 4 ) {
			return;
		}

		var self  = this;
		var digit = $( this.counterId + " g[data-digital-number='" + digitIndex + "']" ).children();
		digit.each( function( index, elem ) {
			$( this ).attr( 'fill', bitOffFillColor );
		});
	};

	Counter.prototype.setDivider = function( isOn ) {
		var divider = $( this.counterId + " g[data-divider='divider']" ).children();
		divider.each( function( index, elem ) {
			$(this).attr( 'fill', isOn ? bitOnFillColor : bitOffFillColor )
		});
	};

	Counter.prototype.updateCount = function() {
		this.currentCount = this.countDirection === countDirDown ? this.currentCount - 1 : this.currentCount + 1;

		if( this.currentCount < 0 ) { this.currentCount = 0; }
		if( this.currentCount > this.maxCount ) { this.currentCount = this.maxCount; }

		this.updateCounterDisplay();
	};

	//=========================================================================
	// INTERVAL INDICATORS CLASS
	//=========================================================================

	var IntervalIndicator = function( warmId, coolId, workId, restId ) {
		this.intervals = {};
		this.intervals [ INTERVAL_WARM ] = warmId;
		this.intervals [ INTERVAL_COOL ] = coolId;
		this.intervals [ INTERVAL_WORK ] = workId;
		this.intervals [ INTERVAL_REST ] = restId;

		this.activeIndicator = INTERVAL_WARM;
	};

	IntervalIndicator.prototype.updateIntervalIndicator = function() {
		for( var interval in this.intervals ) {
			if( interval === this.activeIndicator ) {
				$( this.intervals[ interval ] ).attr( 'fill', bitOnFillColor );
			} else {
				$( this.intervals[ interval ] ).attr( 'fill', bitOffFillColor );
			}
		}
	};

	IntervalIndicator.prototype.updateInterval = function( intervalName ) {
		this.activeIndicator = intervalName;
		this.updateIntervalIndicator();
	};

	//=========================================================================
	// INTERVAL TIMER CLASS
	//=========================================================================

	var IntervalTimer = function( timerProgram ) {
		this.intervalIndicators = new IntervalIndicator( '#indicator-warm', '#indicator-cool', '#indicator-work', '#indicator-rest' );
		this.setProgram( timerProgram )
	};

	IntervalTimer.prototype.setProgram = function( timerProgram ) {
		// Create a array that contains a sequence of intervals, starting with a WARM and ending with a COOL.
		this.program = [ timerProgram[ 'warm' ] ];
		for( var set = 0; set < timerProgram[ 'sets' ]; set++ ) {
			this.program.push( timerProgram[ 'work' ] );
			this.program.push( timerProgram[ 'rest' ] );
		}
		this.program.push( timerProgram[ 'cool' ] );

		this.totalSeconds 	 = this.program.reduce( function( a, b ) { return a + b; } );
		this.programIndex    = 0;
		this.activeIndicator = INTERVAL_WARM;

		// Set up the interval timer displays.
		this.intervalTimeClock  = new DigitalClock( '#digital-clock-interval', this.program[ 0 ] );
		this.elapsedTimeClock   = new DigitalClock( '#digital-clock-elapsed', this.totalSeconds, countDirUp );
		this.remainingTimeClock = new DigitalClock( '#digital-clock-remaining', this.totalSeconds );

		var sets = timerProgram[ 'sets' ];
		this.setCounter      = new Counter( '#counter-sets', sets, countDirUp );
		this.intervalCounter = new Counter( '#counter-intervals', sets ? this.program.length : 0, countDirDown );

		this.intervalIndicators.updateIntervalIndicator();
	};

	IntervalTimer.prototype.start = function() {
		var self = this;

		//console.log( "Starting interval timer" );
		this.timeHandle = setInterval( function(){
			if( self.intervalTimeClock.passOneSecond() <= 0 ) {
				self.updateNextInterval();
			}
			self.elapsedTimeClock.passOneSecond();
			self.remainingTimeClock.passOneSecond();
		}, 1000 );
	};

	IntervalTimer.prototype.stop = function() {
		if( this.timeHandle !== undefined ) {
			clearInterval( this.timeHandle );
			this.timeHandle = undefined;
			//console.log( "Stopping interval timer" );
		}
	};

	IntervalTimer.prototype.reset = function() {
		//console.log( "Reseting interval timer" );
		if( this.timeHandle !== undefined ) {
			clearInterval( this.timeHandle );
			this.timeHandle = undefined;
		}

		this.programIndex = 0;
		this.activeIndicator = INTERVAL_WARM;
		this.intervalTimeClock.updateMaxSeconds( this.program[ 0 ] );
		this.elapsedTimeClock.updateMaxSeconds( this.totalSeconds );
		this.remainingTimeClock.updateMaxSeconds( this.totalSeconds );
		this.setCounter.resetCounter();
		this.intervalCounter.resetCounter();
		this.intervalIndicators.updateInterval( INTERVAL_WARM );
	};

	IntervalTimer.prototype.updateNextInterval = function() {
		this.programIndex  += 1;

		if( this.programIndex >= this.program.length ) {
			this.intervalCounter.updateCount();
			this.stop(); // We're done.
			return 0;
		}

		if( this.activeIndicator === INTERVAL_WARM ) {
			this.activeIndicator = INTERVAL_WORK;
		} else if( this.activeIndicator === INTERVAL_WORK ) {
			this.activeIndicator = INTERVAL_REST;
		} else if( this.activeIndicator === INTERVAL_REST ) {
			if( this.programIndex === this.program.length - 1 ) {
				this.activeIndicator = INTERVAL_COOL;
			} else {
				this.activeIndicator = INTERVAL_WORK;
			}
		}

		if( this.activeIndicator === INTERVAL_WORK ) {
			this.setCounter.updateCount();
		}

		this.intervalCounter.updateCount();
		this.intervalTimeClock.updateMaxSeconds( this.program[ this.programIndex ] );
		this.intervalIndicators.updateInterval( this.activeIndicator );
	};

	//=========================================================================
	// MAIN PROGRAM
	//=========================================================================

	var warmTimerInput = new DigitalClockInput( '#timer-warm', '#minus-warm', '#plus-warm', 900 );
	var coolTimerInput = new DigitalClockInput( '#timer-cool', '#minus-cool', '#plus-cool', 900 );
	var workTimerInput = new DigitalClockInput( '#timer-work', '#minus-work', '#plus-work', 900 );
	var restTimerInput = new DigitalClockInput( '#timer-rest', '#minus-rest', '#plus-rest', 900 );

	var setInput = new SetInput( '#number-set', '#minus-set', '#plus-set', 10 );

	var totalTimeControl = new TotalTime( '#total-time', warmTimerInput, coolTimerInput,
										  workTimerInput, restTimerInput, setInput );

	var timerProgram = {
		warm : 0,
		cool : 0,
		work : 0,
		rest : 0,
		sets : 0
	};

	var intervalTimer = new IntervalTimer( timerProgram );

	$('#start-button').click( function(){
		console.log( 'Start clicked: ' + timerProgram.toString() );
		timerProgram = {
			warm : warmTimerInput.getTime(),
			cool : coolTimerInput.getTime(),
			work : workTimerInput.getTime(),
			rest : restTimerInput.getTime(),
			sets : setInput.getSets()
		};

		intervalTimer.setProgram( timerProgram );
		intervalTimer.start();
	});

	$('#stop-button').click( function(){
		intervalTimer.stop();
	});

	$('#reset-button').click( function(){
		timerProgram = {
			warm : 0,
			cool : 0,
			work : 0,
			rest : 0,
			sets : 0
		};

		intervalTimer.setProgram( timerProgram );
		intervalTimer.reset();
	});
};

$(document).ready( intervalTimerMain );

function toVoice(phrase) {
  var voices = speechSynthesis.getVoices().filter(voice => voice.lang === "en-US");
  voices.forEach(voice => {
      let newPhrase = `${voice.name} ${phrase}`;
      console.log(newPhrase);
      var msg = new SpeechSynthesisUtterance(newPhrase);
      msg.voice = voice;
      speechSynthesis.speak(msg);
      sleep(500);
  });
}

function startClock(time){

}

$(function(){
    var ttsSubmit = document.querySelector("#tts-submit");

    ttsSubmit.addEventListener('click', function(e) {
        e.preventDefault();
        var msg = document.querySelector("#message").value;
        toVoice(msg);
    });
});
