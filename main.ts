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
let P0 = 0
let newP0 = 0
let toggleB = 0
Ensemble.isGateway = true;
Ensemble.start("my device")
basic.forever(function () {
    newP0 = pins.digitalReadPin(DigitalPin.P0)
    if (newP0 != P0) {
        led.toggle(0, 0)
        P0 = newP0
        Ensemble.sendValue("P0", P0)
    }
})
