input.onButtonPressed(Button.A, function () {
    Ensemble.sendValue("btnA", 100)
    Ensemble.sendValue("btnA", 0)
})
input.onButtonPressed(Button.B, function () {
    toggleB = 2 - toggleB
    Ensemble.sendValue("btnB", toggleB)
})
Ensemble.onReceivedValue(function (name, value) {
    led.toggle(value, 0)
})
let toggleB = 0
Ensemble.start("my device")
