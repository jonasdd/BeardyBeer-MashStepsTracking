"use strict"
$(function () {
  var chart = null;
  var T0 = 0;
  T0 = (new Date()).getTime();
  // fonction affichage pour le graph
  function graphise(readTemp) {
    if(chart){
    var x = (new Date()).getTime() - T0, // t0 -> chrono
        y = readTemp;
        chart.series[0].addPoint({x:x, y:y}, true, false);
      }
  }

  // fonction affichage pour le graph
  function graphiseBands(step, index) {
    if(chart){
      var bands = {};
      chart.series[0].xAxis.plotLinesAndBands.forEach(function(band){
          bands[band.id]=band;
      });

      //wainting time
      var id='plot-band-wainting-step-'+index;

      if(step.startWaitingTime !== null){
        var startWaitingTime = step.startWaitingTime - T0;
        var startedTime = null;
        if(step.startedTime === null){
          startedTime = (new Date()).getTime()-T0;
        }else{
          startedTime = step.startedTime - T0;
        }
        var id='plot-band-wainting-step-'+index;
        //if(!bands[id] || bands[id].options.from !== startWaitingTime || bands[id].options.to !== startedTime){
          chart.series[0].xAxis.removePlotBand(id);
          chart.series[0].xAxis.addPlotBand({
              from: startWaitingTime,
              to: startedTime,
              color: '#FCFFC5',
              label:{text: 'Temp rise'},
              id: id
          });
        //}
      }
      //running time
      if(step.startedTime !== null){
        var startTime = step.startedTime - T0;
        var endTime = null;
        if(step.endedTime === null){
          endTime = (new Date()).getTime()-T0;
        }else{
          endTime = step.endedTime - T0;
        }
        var id='plot-band-running-step-'+index;
        //if(!bands[id] || bands[id].options.from !== startTime || bands[id].options.to !== endTime){
          chart.series[0].xAxis.removePlotBand(id);
          chart.series[0].xAxis.addPlotBand({
              from: startTime,
              to: endTime,
              color: '#7FFF55',
              label:{text: 'Step Running'},
              id: id
          });
        //}
      }
      //paused time
      var j=0;
      step.pausedTimes.forEach(function(pause){
        if(pause && pause.start !== null){
          var startTime = pause.start - T0;
          var endTime = null;
          if(pause.end === null){
            endTime = (new Date()).getTime()-T0;
          }else{
            endTime = pause.end - T0;
          }
          var id='plot-band-pause-step-'+index+'-'+j;
          //if(!bands[id] || bands[id].options.from !== startTime || bands[id].options.to !== endTime){
            chart.series[0].xAxis.removePlotBand(id);
            chart.series[0].xAxis.addPlotBand({
                from: startTime,
                to: endTime,
                color: '#D4FF00',
                label:{text: 'Step Paused'},
                id: id
            });
          //}
        }
        j++;
      });
    }
  }

//$(document).ready(function () {
chart = new Highcharts.Chart({
    chart: {
        renderTo: 'containerGraph',
        animation: Highcharts.svg, // don't animate in old IE
        type: 'spline'
    },
    connectNulls: true,
    plotOptions: {
      series: {
          color: '#2ecc71',
          lineWidth: 1
      }
    },
    title: {
        text: 'Live mashsteps temp tracking'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'Temp',
            margin: 80
        }
    },
    enabled: true,
    series: [{
        name: 'Temp',
        data: [{x:0, y:25}]
    }]
});

$(".chart-export").each(function() {
  var jThis = $(this),
      chartSelector = jThis.data("chartSelector"),
      chart = $(chartSelector).highcharts();

  $("*[data-type]", this).each(function() {
    var jThis = $(this),
        type = jThis.data("type");
    if(Highcharts.exporting.supports(type)) {
      jThis.click(function() {
        chart.exportChartLocal({ type: type });
      });
    }
    else {
      jThis.attr("disabled", "disabled");
    }
  });
});
//});
//logJSON(data);

class MashStep {
    constructor(node) {
        this.node = node;
        this.clockNode = $(this.node.find('.clock')[0]);
        this.tempNode = $(this.node.find('.tempSetSelect .value')[0]);
        this.tempInputNode = $(this.node.find('.tempSetSelect')[0]);
        this.tempLiveInputNode = $(this.node.find('.tempSetSelect .value').text());
        this.timer = null;
        this.counter = 0;
        this.initialCounter = 0;
        this.temp = 0;
        this.active = true;
        this.status = 'neverstarted';
        this.current = false;
        this.previous = null;
        this.next = null;
        this.timerCircle = null;
        this.startedTime = null;
        this.startWaitingTime = null;
        this.endedTime = null;
        this.pausedTimes = [];
        this.initCounter();
        this.initTemp();
        this.displayTime();
        this.displayActive();
        this.bindEvents();
    }

    nextStep(){
      return this.next;
    }
    previousStep(){
      return this.previous;
    }

    initCounter(){
      this.counter = parseInt(this.clockNode.data("countdown"));
    }

    initTemp(){
        this.temp = parseInt(this.tempNode.text());
    }

    goToNext(){
        this.current = false;
        this.pauseTimer();
        this.display();
        if(this.next){
          this.next.current = true;
          this.next.startWhenReady();
          this.next.display();
        }else{
          this.node.trigger("mash:terminate");
        }
    }

    endOfTime(){
        clearInterval(this.timer);
        if(this.timerCircle!==null){
          this.timerCircle.destroy();
          this.timerCircle = null;
          this.node.removeClass('courrant');
        }
        this.status='terminated';
        this.node.trigger("mash-step:terminate");
        this.goToNext();
        return;
    }

    timerFn(){
      if (this.counter <= 0) {
        return this.endOfTime();
      }
      this.counter--;
      this.displayTime();
      this.colorizeTemp();

    }

    startTimer(){
      this.timer = setInterval(this.timerFn.bind(this), 1000);
      if(this.status !== 'paused'){
        this.startedTime = (new Date()).getTime();
        this.initialCounter = this.counter;
        // progress bar
        this.timerCircle = new ProgressBar.Circle(this.tempInputNode[0], {
          color: '#27ae60',
          strokeWidth: 6,
          fill: 'transparent',
          svgStyle  : {
              display: 'block',
              width: '100%',
              position: 'absolute',
              left: '0',
              top: '0',
          }
        });
        this.node.trigger("mash-step:start");
      } else {
        var endTime = (new Date()).getTime();
        this.pausedTimes[this.pausedTimes.length-1].end = endTime;
        this.node.trigger("mash-step:unpause");
      }
      this.status = 'running';
      this.display();
    }

    startWhenReady(){
      var self = this;
      if(!this.active){
        this.goToNext();
        return;
      }
      if(this.status === 'neverstarted'){
        $(document).trigger("mash-step:initialize");
        this.startWaitingTime = (new Date()).getTime();
        var initialStartCounter = setInterval(function(){
          var liveValueToCompare = parseInt($('#liveValue').text());
          if(liveValueToCompare > self.temp){
            self.startTimer();
            clearInterval(initialStartCounter);
          }
        }, 1000);
        this.status = 'waiting';
        this.display();
        this.node.trigger("mash-step:waiting");
      }
    }

    stopTimer(){
      clearInterval(this.timer);
      this.endedTime = (new Date()).getTime();
      if(this.status == 'paused'){
        this.pausedTimes[this.pausedTimes.length-1].end = this.endedTime;
      }
      this.initCounter();
      this.status = 'stopped';
      this.display();
      this.node.trigger("mash-step:stop");
    }

    pauseTimer(){
      if(this.status == 'running'){
        clearInterval(this.timer);
        this.pausedTimes.push({start: (new Date()).getTime(), end: null});
        this.status = 'paused';
        this.display();
        this.node.trigger("mash-step:pause");
      }
    }

    bindEvents(){

      var self = this;

      this.node.find('.play').on('click', function (event) {
          self.startTimer();
      });
      this.node.find('.pause').on('click', function (event) {
          self.pauseTimer();
      });

      this.node.find('.stop').on('click', function (event) {
          self.stopTimer();
      });

      this.node.find('.switch').on('switchChange.bootstrapSwitch', function(event) {
        var target = $(event.target);
        if (target.closest('.bootstrap-switch').hasClass('bootstrap-switch-off')){
          self.active = false;
        }
        else if (target.closest('.bootstrap-switch').hasClass('bootstrap-switch-on')){
         self.active = true;
        }
        self.displayActive();
        self.node.trigger("mash-step:change");
      });
      
      var setTempField = this.node.find('.setTemp');
      var setCountField = this.node.find('.setTime');

      var timerChange = null;
      this.node.find(".change .plus").mousedown(function(event){
          timerChange = setInterval(function(){
            if (setCountField.hasClass('currentField')){
             self.pauseTimer();
             self.counter+=60;
             self.displayTime();
            }
            else if (setTempField.hasClass('currentField')){
             self.temp+=1;
             self.displayTemp();
            }
        }, 200);
        event.preventDefault();
        event.stopPropagation();
        self.node.trigger("mash-step:change");
      });

      this.node.find(".change .moins").bind('mousedown touchstart',function(event){
          timerChange = setInterval(function(){
            if (setCountField.hasClass('currentField')){
             self.pauseTimer();
             self.counter=Math.max(0,self.counter-60);
             self.displayTime();
            }
            else if (setTempField.hasClass('currentField')){
             self.temp=Math.max(0,self.temp-1);
             self.displayTemp();
            }
        }, 200);
        event.preventDefault();
        event.stopPropagation();
        self.node.trigger("mash-step:change");
      });

      this.node.find(".change .moins,.change .plus").bind('mouseup touchend',function(event){
        clearInterval(timerChange);
        event.preventDefault();
        event.stopPropagation();
      });
    }

    displayActive(){
      if(this.active){
        this.node.removeClass('inactiveSO courrant neverstarted running waiting paused stopped terminated');
      } else {
        this.node.addClass('inactiveSO');
      }
    }


    displayTime(){
      var seconds = this.counter%60; 
      var minutes = Math.floor(this.counter/60)%60;
      var hours = Math.floor(this.counter/(60*60));

      hours = (hours < 10) ? "0" + hours : hours;
      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;

      this.clockNode.text(hours + ":" + minutes + ":" + seconds);
      if(this.timerCircle){
          this.timerCircle.animate((this.initialCounter-this.counter)/this.initialCounter, {
              duration: 1000
          });
      }
    }

    displayTemp(){
      this.tempNode.text(this.temp);
      
    }

    display(){
      this.node.removeClass('courrant neverstarted running waiting paused stopped terminated');
      /*this.node.removeClass('neverstarted');
      this.node.removeClass('running');
      this.node.removeClass('waiting');
      this.node.removeClass('paused');
      this.node.removeClass('stopped');
      this.node.removeClass('terminated');*/
      if(!this.active){
        //this.node.attr('style','background:green');
      } 
      if(this.current){
        this.node.addClass('courrant');
        //this.node.attr('style','background:red');
      }
      if(this.status!=='running' || this.status !== 'paused'){
        this.tempInputNode.removeClass('blink');
      }
      this.node.addClass(this.status);
    }

    colorizeTemp(){
      var self = this;
      var liveValueToCompare = parseInt($('#liveValue').text());

      if (liveValueToCompare > this.temp){
        this.tempInputNode.css('backgroundColor', function(){
          var difference = (100 - ((liveValueToCompare - self.temp)*10));
          return 'hsl(360, 100%, ' + difference + '%)';
          PauseSound();
        });
        if ((liveValueToCompare - this.temp) > 4){
          this.tempInputNode.addClass('blink');
          PlaySound();
        }
        else{
          this.tempInputNode.removeClass('blink');
          PauseSound();
        }
      }
      else if (liveValueToCompare < this.temp){
        this.tempInputNode.css('backgroundColor', function(){
          var difference = (100 - (self.temp - liveValueToCompare)*10);
          return 'hsl(255, 100%, ' + difference + '%)';
          PauseSound();
        });
        if ((this.temp - liveValueToCompare) > 4){
          this.tempInputNode.addClass('blink');
          PlaySound();
        }
        else{
          this.tempInputNode.removeClass('blink');
          PauseSound();
        }
      }
    }
}


var mashStarted = false;

var mashSteps = [];
//detection et construction des step
var previous = null;
$(".mashStep").each(function(index) {
  var node =$(this);
  var current = new MashStep(node);
  if(previous!==null) previous.next = current;
  current.previous = previous;
  mashSteps.push(current);
  previous = current;
});

//Init de la tache courante

var currentMash = null;
mashSteps.every(function(mashStep){
  if(mashStep.active){
    currentMash=mashStep;
    currentMash.current = true;
    currentMash.display();
    return false;
  }
  return true;
});


function findCurrentStep(){
  mashSteps.every(function(mashStep){
    if(mashStep.current){
      currentMash=mashStep;
      return false;
    }
    return true;
  });
}

 /************************/
// gestion actif inactif a inclure dans la tache aussi

var options = {
    onText: "activ",
    onColor: 'success',
    offColor: 'danger',
    offText: "inactive",
    state: true,
};

$('input').change(function(){
  $('.change').addClass('inactive');
  $('.set').removeClass('currentField');

  $(this).parents('.set').addClass('currentField');
  $('.mashStep').removeClass('courrant');

  $(this).closest('.mashStep').addClass('courrant');
  //currentTempValue = $('.courrant .currentField label span.value').text();
  //currentTimeValue = $(".courrant .clock").data('current-count');

  //console.log(currentTempValue);
  if ($('.mashStep').hasClass('courrant') ){
  $('.mashStep.courrant').find('.change').removeClass('inactive');
  //alert('dd');
  //console.log($(this));
  }
  else{
    return;
  }
});

$(".switch").bootstrapSwitch(options);

function modalInfo (){
  $('#modalInfo').modal(options);
  $('#modalInfo .message').text("bla");
}
function PlaySound() {
  var sound = document.getElementById("soundObj");
  sound.play();
}
function PauseSound() {
  var sound = document.getElementById("soundObj");
  sound.pause();
}

$('button.startMash').click(function(){
  if(!mashStarted){
    mashStarted = true;
    chart.series[0].setData([], true);
    currentMash.startWhenReady();
  }else if(currentMash.status !== 'waiting'){
    currentMash.startTimer();
  }
});
$('button.pauseMash').click(function(){
  currentMash.pauseTimer();
});
$('button.nextMash').click(function(){
  currentMash.goToNext();
});

$(document).on('mash-step:start', findCurrentStep);
$(document).on('mash:terminate', function(event){
  clearInterval(graphUpdater);
  modalInfo();
});

var graphUpdater = setInterval(function(){
  var i =0;
  mashSteps.forEach(function(step){
    graphiseBands(step, i)
    i++;
  });
  var liveValueToCompare = parseInt($('#liveValue').text());
  graphise(liveValueToCompare);
},5000);

/// fullscreen
document.addEventListener("keydown", function(e) {
  if (e.keyCode == 13) {
    toggleFullScreen();
  }
}, false);

$('a[data-toggle="tab"]').on('click',function(event){
  setTimeout(function(){$(window).trigger('resize');}, 5);
});

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}


});


