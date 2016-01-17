$(".glyphicon-question-sign").click(function(){

var tour = new Tour({
  steps: [
  {
    title: "Go fullscreen",
    content: "Press enter to go fullscreen",
    placement: "bottom",
    backdrop: true,
    orphan: true
  },
  {
    element: "#port-picker",
    title: "Choose port",
    content: "Choose your correct arduino Port.",
    placement: "bottom"
  },
  {
    element: "#connect-button",
    title: "Connect",
    content: "Connect to arduino once port is selected",
    placement: "left"
  },
  {
    element: ".mashStep1 .tempSetSelect",
    title: "Target temp",
    content: "Click on the first mash step temp",
    placement: "right"
  },
  {
    element: ".mashStep1 .glyphicon-chevron-left.plus",
    title: "Add",
    content: "Click on arrow up to increase temp",
    placement: "right"
  },
  {
    element: ".mashStep1 .glyphicon-chevron-left.moins",
    title: "Add",
    content: "Click on arrow down to decrease temp",
    placement: "right"
  },
  {
    element: ".mashStep1 .timeSetSelect",
    title: "Target time",
    content: "Do the same for the step duration",
    placement: "bottom"
  },
  {
    element: "",
    title: "Do the same",
    content: "Do the same for all steps",
    orphan: true,
    backdrop: true
  },
  {
    element: ".mashStep4 .bootstrap-switch",
    title: "Avoid",
    content: "If your don\'t want a step click on active/inactive switch",
    placement: "top"
  },
  {
    element: ".startMash",
    title: "Start",
    content: "You are now able to start your Mashes. Have a nice Brew !",
    placement: "top"
  }
]});

// Initialize the tour
tour.init();

// Start the tour
tour.start();

});