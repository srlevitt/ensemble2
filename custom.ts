input.onButtonPressed(Button.B, function () {
    Ensemble.EnsembleSendValue("pushed", 100)
})
Ensemble.onReceivedValue(function (name, value) {
	
})
Ensemble.EnsembleStart("Microbit")
basic.forever(function () {
	
})
