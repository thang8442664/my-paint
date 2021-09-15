

const tools = document.querySelectorAll('[data-tool]');
const inputColor = document.querySelector('#color-select');
const lineWidthSelect = document.querySelectorAll('.size-select li');
const colorSelected = document.querySelector('.color-selected');
const colorItem = document.querySelectorAll('.color-item');
const undoButton = document.querySelector('.do-button.undo');
const redoButton = document.querySelector('.do-button.redo');
const overlay = document.querySelector('.overlay');
const textTool = document.querySelector('.text-tool');
const toolList = document.querySelector('.tool-list');
const fontSelect = document.getElementById('font-select');
const textStyle = document.querySelectorAll('.text-style');
const textFontSize = document.querySelector('.text-fs');

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const background = new Image();
background.src = canvas.toDataURL('image/bmp', 1.0);

canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;

const paint = {
    isDrawing: false,
    lineWidth: 1,
    color: '#000000',
    currentPos: null,
    mousePos: null,
    zoom: false,
    currentZoom: 0,
    tool: 'pen',
    images: [background],
    currentImage: 0,
    tempImage: new Image(),
    textConfig: {
        fontSize: 16,
        fontStyle: {
            weight: false,
            italic: false,
            underline: false,
        },
        fontFamily: 'Arial',
    },

    listenerEvents: function() {
        canvas.addEventListener('mouseenter', (e) => this.handleEvents.mouseEnter());
        canvas.addEventListener('mousedown', (e) => this.handleEvents.mouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleEvents.mouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleEvents.mouseUp(e));
        canvas.addEventListener('click', (e) => this.handleEvents.click(e));

        overlay.addEventListener('click', (e) => this.handleEvents.overlay(e));

        colorItem.forEach(i => { 
            i.style.backgroundColor = i.dataset.color;
            i.addEventListener('click', (e) => this.handleEvents.colorSelect(e))
        })

        inputColor.addEventListener('input', (e) => this.handleEvents.colorSelect(e))

        lineWidthSelect.forEach(i => {
            i.addEventListener('click', () => this.handleEvents.sizeSelect(i))
        })
        
        tools.forEach(i => {
            i.addEventListener('click', () => this.handleEvents.toolSelect(i))
        })

        undoButton.addEventListener('click', this.handleEvents.undo)
        redoButton.addEventListener('click', this.handleEvents.redo)

        fontSelect.addEventListener('input', (e) => this.handleEvents.fontSelect(e))

        textStyle.forEach(i => {
            i.addEventListener('click', () => this.handleEvents.textStyle(i))
        })

        textFontSize.addEventListener('input', (e) => this.handleEvents.textFontSize(e))
    },

    handleEvents: {

        overlay(e) {
            const input = document.getElementById('write-text');
            const text = input.value;
            text && paint.drawText(text, paint.textConfig);
            if (paint.textConfig.fontStyle.underline) {
                ctx.lineWidth = paint.lineWidth;
                ctx.strokeStyle = paint.color;
                ctx.beginPath();
                ctx.moveTo(
                    paint.currentPos.x , 
                    paint.currentPos.y + (paint.textConfig.fontSize / 2),
                );
                ctx.lineTo(
                    paint.currentPos.x + ctx.measureText(text).width, 
                    paint.currentPos.y + (paint.textConfig.fontSize / 2)
                );
                ctx.stroke();
            }
            overlay.classList.add('d-none');
            textTool.classList.add('d-none');
            toolList.classList.remove('d-none');
            input.remove();
        },

        click(e) {
            if (paint.zoom){
                ++paint.currentZoom
                e.target.style.zoom = `${100 + paint.currentZoom * 10}%`;
            }
            
            else if (paint.tool === 'color-picker'){
                var rgb = ctx.getImageData(paint.currentPos.x, paint.currentPos.y, 1, 1).data
                var hex = "#" + ("000000" + paint.rgbToHex(rgb[0], rgb[1], rgb[2])).slice(-6);
                colorSelected.style.backgroundColor = hex;
                paint.color = hex;
            }

            else if (paint.tool === 'text') {
                const input = document.createElement('input');
                input.id = 'write-text';
                input.type = 'text';
                input.style.position = 'fixed';
                input.style.top = e.pageY + 'px';
                input.style.left = e.pageX + 'px';
                input.style.transform = 'translateY(-50%)';
                input.style.color = paint.color;
                input.style.outline = 'none';
                input.style.border = 'none';
                input.style.fontSize = paint.textConfig.fontSize;
                input.style.fontWeight = paint.textConfig.fontStyle.weight ? 'bold' : '';
                input.style.fontStyle = paint.textConfig.fontStyle.italic ? 'italic' : '';
                input.style.textDecoration = paint.textConfig.fontStyle.underline ? 'underline' : '';
                input.style.fontFamily = paint.textConfig.fontFamily;
                document.body.appendChild(input);
                overlay.classList.remove('d-none');
                textTool.classList.remove('d-none');
                toolList.classList.add('d-none');
            }

            else if (paint.tool === 'zoom-in') {
                console.log(123)
            }

            else if (paint.tool === 'zoom-out') {
                console.log(123)
            }
        },

        mouseEnter() {
            

            if (paint.tool === 'eraser'){
                canvas.style.cursor = 'grab';
                paint.color = '#fff';
                colorSelected.style.backgroundColor = '#fff';
            }

            else if (paint.tool === 'zoom-in'){
                canvas.style.cursor = 'zoom-in';
            }

            else if (paint.tool === 'zoom-out'){
                canvas.style.cursor = 'zoom-out';
            }

            else if (paint.tool === 'color-picker'){
                canvas.style.cursor = 'copy';
            }

            else if (paint.tool === 'text'){
                canvas.style.cursor = 'text';
            }

            else {
                canvas.style.cursor = 'crosshair';
            }

        },

        mouseDown(e) {
            paint.isDrawing = true;
            paint.currentPos = paint.getMousePos(e);
            paint.tempImage.src = canvas.toDataURL('image/bmp', 1.0);
           
        },

         mouseMove(e) {
            if (!paint.isDrawing) return;

            paint.mousePos = paint.getMousePos(e);

            if (paint.tool === 'pen' || paint.tool === 'eraser') {
                paint.drawLine(paint.currentPos, paint.mousePos);
            }

            else if (paint.tool === 'line') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(paint.tempImage, 0, 0);
                paint.drawLine(paint.currentPos, paint.mousePos);
                return;
            }
            
            else if (paint.tool === 'rect'){
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(paint.tempImage, 0, 0);
                paint.drawRect(paint.currentPos, paint.mousePos);
                return;
            }

            else if (paint.tool === 'circle'){
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(paint.tempImage, 0, 0);
                paint.drawCircle(paint.currentPos, paint.mousePos);
                return;
            }

            paint.currentPos = paint.mousePos;
        },

        mouseUp(e) {
            paint.isDrawing = false;
            ctx.closePath();
            paint.save();
            paint.checkCurrentImage();
        },

        colorSelect(e) {
            paint.color = e.target.dataset.color || e.target.value;
            colorSelected.style.backgroundColor = e.target.dataset.color || e.target.value;
            if (document.getElementById('write-text')){
                document.getElementById('write-text').style.color = e.target.dataset.color || e.target.value;
            }
        },

        sizeSelect(i) {
            document.querySelector('.size-select li.selected').classList.remove('selected');
            i.classList.add('selected');
            paint.lineWidth = i.dataset.size;
        },

        toolSelect(i){
            document.querySelector('[data-tool].selected').classList.remove('selected');
            i.classList.add('selected');
            paint.tool = i.dataset.tool;
        },

        undo() {
            paint.currentImage--;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(paint.images[paint.currentImage], 0, 0);
            paint.checkCurrentImage();
        },

        redo() {
            paint.currentImage++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(paint.images[paint.currentImage], 0, 0);
            paint.checkCurrentImage();
        },

        fontSelect(e) {
            const input = document.getElementById('write-text');
            input.style.fontFamily = e.target.value;
            paint.textConfig.fontFamily = e.target.value;
        },

        textStyle(i) {
            const input = document.getElementById('write-text');
            i.classList.toggle('selected');
            paint.textConfig.fontStyle[i.dataset.style] = !paint.textConfig.fontStyle[i.dataset.style];
            input.style.fontWeight = paint.textConfig.fontStyle.weight ? 'bold' : '';
            input.style.fontStyle = paint.textConfig.fontStyle.italic ? 'italic' : '';
            input.style.textDecoration = paint.textConfig.fontStyle.underline ? 'underline' : '';
        },

        textFontSize(e) {
            const input = document.getElementById('write-text');
            input.style.fontSize = textFontSize.value + 'px';
            paint.textConfig.fontSize = textFontSize.value;
        }
    },

    checkCurrentImage: function() {
        if (this.currentImage === 0) {
            undoButton.classList.add('disabled');
            undoButton.disabled = true;
        } else {
            undoButton.classList.remove('disabled');
            undoButton.disabled = false;
        }

        if (this.currentImage >= this.images.length - 1) {
            redoButton.classList.add('disabled');
            redoButton.disabled = true;
        } else {
            redoButton.classList.remove('disabled');
            redoButton.disabled = false;
        }
    },

    save() {
        const img = new Image();
        img.src = canvas.toDataURL('image/bmp', 1.0);
        this.images.push(img);
        this.currentImage++;
        this.images.length = this.currentImage + 1;
    },

    rgbToHex: function(r, g, b) {
        if (r > 255 || g > 255 || b > 255)
            throw "Invalid color component";
        return ((r << 16) | (g << 8) | b).toString(16);
    },

    getMousePos: function(e) {
        const rect = canvas.getBoundingClientRect();
        return {
             x: e.pageX - rect.left, 
             y: e.pageY - rect.top ,
        }
    },

    drawLine: function(currentPos, mousePos) {
        this.config();
        ctx.beginPath();
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
    },

    drawRect: function(currentPos, mousePos) {
        this.config();
        ctx.beginPath();
        ctx.strokeRect(
            currentPos.x, 
            currentPos.y, 
            mousePos.x - currentPos.x, 
            mousePos.y - currentPos.y,
        );
        ctx.stroke();
    },

    drawCircle: function(currentPos, mousePos) {
        if (mousePos.x - currentPos.x < 0) return;
        this.config();
        ctx.beginPath();
        ctx.arc(
            currentPos.x, 
            currentPos.y, 
            mousePos.x - currentPos.x, 
            0, 
            2 * Math.PI,
        );
        ctx.stroke();
    },

    drawText: function(text, config){
        ctx.textBaseline = "middle";
        ctx.font = `
                    ${config.fontStyle.weight ? 'bold' : ''}
                    ${config.fontStyle.italic ? 'italic' : ''}
                    ${config.fontSize}px 
                    ${config.fontFamily} 
        `;
        ctx.fillStyle = this.color;;
        ctx.fillText(text, this.currentPos.x, this.currentPos.y );
    },

    config: function(){
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.color;
    },

    start: function() {
        this.listenerEvents();
    },
}

paint.start();