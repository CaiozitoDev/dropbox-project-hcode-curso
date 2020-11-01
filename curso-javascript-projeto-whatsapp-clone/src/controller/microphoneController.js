import ClassEvents from '../utils/classEvents'

export default class MicrophoneController extends ClassEvents {
    constructor() {
        super()

        this._mimeType = 'audio/webm'
        this._available = false

        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(stream => {
            this._stream = stream

            this._available = true

            this.trigger('ready', this._stream)
        }).catch(err => console.log(err))
    }

    stop() {
        this._stream.getTracks().forEach(track => {
            track.stop()
        })
    }

    isAvailable() {
        return this._available
    }

    startRecording() {
        if(this.isAvailable()) {
            this._mediaRecorder = new MediaRecorder(this._stream, {
                mimeType: this._mimeType
            })

            this._recordedChunks = []

            this._mediaRecorder.addEventListener('dataavailable', e => {
                if(e.data.size > 0) this._recordedChunks.push(e.data)
            })

            this._mediaRecorder.addEventListener('stop', e => {
                let blob = new Blob(this._recordedChunks, {
                    type: this._mimeType
                })

                let filename = `rec${Date.now()}.webm`

                let audioContext = new AudioContext()

                let reader = new FileReader()

                reader.onload = () => {
                    audioContext.decodeAudioData(reader.result).then(decode => {
                        let file = new File([blob], filename, {
                            type: this._mimeType,
                            lastModified: Date.now()
                        })

                        this.trigger('recorded', file, decode)
                    })
                }

                reader.readAsArrayBuffer(blob)
            })

            this._mediaRecorder.start()
            this.startTimer()
        }
    }

    stopRecording() {
        if(this.isAvailable()) {
            this._mediaRecorder.stop()
            this.stop()
            this.stopTimer()
        }   
    }

    startTimer() {
        let start = Date.now()

        this._recordMicrophoneInterval = setInterval(() => {
            this.trigger('recordingTimer', Date.now() - start)
        }, 100)
    }

    stopTimer() {
        clearInterval(this._recordMicrophoneInterval)
    }
}