/**
 * Provides access to Apollo Ensemble functionality.
 */
//% color=190 weight=100 icon="\uf1e0" block="Ensemble"
namespace Ensemble
{
    const MAX_MESSAGE_LENGTH = 19;
    const MAX_NAME_LENGTH = 10;
    const POS_MSG_TYPE = 0;
    const POS_DEVICE_ID = POS_MSG_TYPE + 1;
    const POS_VALUE = POS_DEVICE_ID + 4;
    const POS_NAME = POS_VALUE + 4;

    const MSG_TYPE_DEVICE_ID = 99;
    const MSG_TYPE_VALUE_TO_ENSEMBLE = 98;
    const MSG_TYPE_VALUE_FROM_ENSEMBLE = 97;

    let deviceName = "";
    let deviceId = control.deviceSerialNumber();
    let started = 0;
    let onReceivedValueHandler: (name: string, value: number) => void;
        
    function sendId()
    {
        let msg = pins.createBuffer(MAX_MESSAGE_LENGTH);
        msg.fill(0);
        msg.setUint8(POS_MSG_TYPE, MSG_TYPE_DEVICE_ID);
        msg.setNumber(NumberFormat.Int32LE, POS_DEVICE_ID, deviceId);
        deviceName = control.deviceName().substr(0,MAX_NAME_LENGTH);
        for(let i=0; i < MAX_NAME_LENGTH; i++)
        {
            msg.setUint8(POS_NAME + i, deviceName.charCodeAt(i));
        }
        radio.sendBuffer(msg);
    }

    control.inBackground(function ()
    {
        while(true)
        {
            if (started)
            {
                sendId();
            }
            pause(5000);
        }
    })

    radio.onReceivedBuffer(function (buff : Buffer)
    {
       serial.writeLine(buff.length());
       let msgType = buff.getUint8(POS_MSG_TYPE);
       let devId = buff.getNumber(NumberFormat.Int32LE, POS_DEVICE_ID);
       let value = buff.getNumber(NumberFormat.Int32LE, POS_VALUE);
       let name = "";
       let i = 0;
       let ch = buff.getUint8(POS_NAME + i++);
       while((ch != 0) && (i < MAX_NAME_LENGTH))
       {
           name = name + String.fromCharCode(ch);
           ch = buff.getUint8(POS_NAME + i++);
       }
        serial.writeLine("typ " + msgType + " dev " + devId + " val " + value + " name " + name);
//        if ((msgType == MSG_TYPE_VALUE_FROM_ENSEMBLE) && (devId == deviceId))
        if ((msgType == MSG_TYPE_VALUE_TO_ENSEMBLE) && (devId != deviceId))
        {
            if (onReceivedValueHandler)
            {
                onReceivedValueHandler(name, value);        
            }
        }        
    })

   /**
     * Registers code to run when the radio receives a value from Ensemble
     */
    //% help=ensemble/on-received-value
    //% blockId=ensemble_on_value_drag block="on ensemble received" blockGap=16
    //% useLoc="ensemble.onDataPacketReceived" draggableParameters=reporter
    export function onReceivedValue(cb: (name: string, value: number) => void)
    {
        onReceivedValueHandler = cb;
    }

    /**
     * Sends a named value to Ensemble
     */
    //% blockId=ensemble_send_value
    //% block="send|value %n %v"
    export function sendValue(name:string, value:number)
    {
        let msg = pins.createBuffer(MAX_MESSAGE_LENGTH);
        msg.fill(0);
        msg.setUint8(POS_MSG_TYPE, MSG_TYPE_VALUE_TO_ENSEMBLE);
        msg.setNumber(NumberFormat.Int32LE, POS_DEVICE_ID, deviceId);
        msg.setNumber(NumberFormat.Int32LE, POS_VALUE, value);
        name = name.substr(0, MAX_NAME_LENGTH);
        for(let i=0; i < name.length; i++)
        {
            msg.setUint8(POS_NAME + i, name.charCodeAt(i));
        }
        radio.sendBuffer(msg);
    }

    /**
     * Stops communications to Ensemble
     */
    //% blockId=ensemble_stop
    //% block="stop"
    export function stop()
    {
        deviceName = "";
        started = 0;
        sendId();
    }

    /**
     * Starts communications to Ensemble
     * @param name Name for this device;
     */
    //% blockId=ensemble_start
    //% block="start %n"
    export function start(name:string)
    {
        deviceName = name.substr(0, MAX_NAME_LENGTH);
        started = 1;
        radio.setGroup(1)
        radio.setTransmitSerialNumber(true);
        sendId();
    }

}