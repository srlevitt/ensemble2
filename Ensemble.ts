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
        
    export let isGateway:boolean = false;
    
    function sendPacket(msgType:number, id:number, value:number, name:string)
    {
        let msg = pins.createBuffer(MAX_MESSAGE_LENGTH);
        msg.fill(0);
        msg.setUint8(POS_MSG_TYPE, msgType);
        msg.setNumber(NumberFormat.Int32LE, POS_DEVICE_ID, id);
        msg.setNumber(NumberFormat.Float32LE, POS_VALUE, value);
        name = name.substr(0, MAX_NAME_LENGTH);
        for(let i=0; i < name.length; i++)
        {
            msg.setUint8(POS_NAME + i, name.charCodeAt(i));
        }
        radio.sendBuffer(msg);
        if (isGateway)
        {
            serial.writeLine("");
            serial.writeLine(msgType + "|" + id + "|" + value + "|" + name);
        }
    }

    function sendId()
    {
        sendPacket(MSG_TYPE_DEVICE_ID, deviceId, 0, deviceName);
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
       let msgType = buff.getUint8(POS_MSG_TYPE);
       let devId = buff.getNumber(NumberFormat.Int32LE, POS_DEVICE_ID);
       let value = buff.getNumber(NumberFormat.Float32LE, POS_VALUE);
       let name = "";
       let i = 0;
       let ch = buff.getUint8(POS_NAME + i++);
       while((ch != 0) && (i < MAX_NAME_LENGTH))
       {
           let newCh = String.fromCharCode(ch);
           if (newCh == '|')
           {
               newCh = '_';
           }
           name = name + newCh;
           ch = buff.getUint8(POS_NAME + i++);
       }

        switch(msgType)
        {
            case MSG_TYPE_VALUE_FROM_ENSEMBLE:
                if (devId == deviceId)
                {
                    if (onReceivedValueHandler)
                    {
                        onReceivedValueHandler(name, value);        
                    }
                }        
                break;           

            case MSG_TYPE_VALUE_TO_ENSEMBLE:
            case MSG_TYPE_DEVICE_ID:
                if (isGateway)
                {
                    serial.writeLine("");
                    serial.writeLine(msgType + "|" + devId + "|" + value + "|" + name);
                }
                break;
        }
    })

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () 
    {
        if (started && isGateway)
        {
            let buff = serial.readLine();
            let toks = buff.split("|");
            if (toks.length >= 4)
            {
                let msgType = parseInt(toks[0]);
                if (msgType == MSG_TYPE_VALUE_FROM_ENSEMBLE)
                {
                    let devId = parseInt(toks[1]);
                    let value = parseFloat(toks[2]);
                    let name = toks[3].trim();
                    if (devId == deviceId)
                    {
                        if (onReceivedValueHandler)
                        {
                            onReceivedValueHandler(name, value);        
                        }
                    }        
                    else
                    {
                        sendPacket(msgType, devId, value, name);
                    }
                }
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
        if (started)
        {
            sendPacket(MSG_TYPE_VALUE_TO_ENSEMBLE, deviceId, value, name);
        }
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
        deviceName = name.substr(0, MAX_NAME_LENGTH).replace("|", "_");
        started = 1;
        radio.setGroup(1)
        radio.setTransmitSerialNumber(true);
        sendId();
    }

}