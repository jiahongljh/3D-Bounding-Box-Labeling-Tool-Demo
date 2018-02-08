// TODO:
//   implement JPEG feature of packAnnotation()
//	 implement JPEG feature
//   implement server sending feature of archiveWorkFiles()
//   implement branch feature bbox reader
// Instantiate with WorkSpace("PCD")
class WorkSpace {
    constructor(dataType) {
        this.classColor = {
            car: "blue",
            bus: "green",
            van: "red",
            truck: "yellow",
            pedestrian: "purple",
            cyclist: "orange",
            motorcyclist: "cyan"
        };
        this.labelId = -1;
        this.workBlob = ''; // Base url of blob
        this.curFile = 0; // Base name of current file
        this.fileList = [];
        this.JPEGFileList = [];
        this.JPEGNumsList = [];
        this.dataType = dataType; // JPEG or PCD
        this.originalSize = [0, 0]; // Original size of jpeg image
        this.bboxes = []; // Bounding boxes
        this.results = []; // Replacement of azure blob for output
        this.originalBboxes = []; // For checking modified or not
        this.hold_flag = false; //Hold bbox flag
        this.labeling_files = [];
    }

    /********** Externally defined functions **********
     * Define with the prototype in the labeling tools.
     **************************************************/

    // Visualize 2d and 3d data
    showData() {}

    // Set values to this.bboxes from annotations
    loadAnnotations(annotations) {}

    // Create annotations from this.bboxes
    packAnnotations() {}


    /****************** Public functions **************/

    // Call this first to specify target label
    setLabelId(labelId) {
        this.labelId = labelId;
    }


    getFileList(datatype, toNum) {
        var str_list = [];
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", this.workBlob + '/ImageSet/Main/' + 'test' + datatype + '.txt' + '?' + new Date().getTime(), false);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.responseText;
                    str_list = allText.split("\n");
                    str_list.pop();
                    if (toNum == true) {
                        for (var i = 0; i < str_list.length; i++) {
                            str_list[i] = str_list[i].split('-')[2].split('.')[0] + str_list[i].split('-')[2].split('.')[1] + '000';
                        }
                    }
                }
            }
        }
        rawFile.send(null);
        return str_list;
    }



    // Get informations of workspace (call this for initialization)
    getWorkFiles() {
        this.workBlob = "static/input"; // "https://devrosbag.blob.core.windows.net/labeltool/3d_label_test";
        this.curFile = 0; // For test (please make labeling tool start with frame:1)
        this.fileList = this.getFileList('PCD', false);
        this.JPEGFileList = this.getFileList('JPEG', false);
        this.JPEGNumsList = this.getFileList('JPEG', true);
        /* Note the formats
        this.fileList - pcd_1504861087834944
        this.JPEGFileList - camera-000000-1504861084.747
        this.JPEGNumsList - 1504861084747000
        */
        this.results = new Array(this.fileList.length);
        this.originalSize[0] = 1600;
        this.originalSize[1] = 1200;
        if (this.dataType == "JPEG") {
            dirBox.value = this.workBlob;
        } else {
            if (!Detector.webgl) Detector.addGetWebGLMessage();
            init();
            animate();
        }
        this.showData();
    }

    // Create workspace on server
    setWorkFiles() {
        this.getWorkFiles();
    }

    // Get annotations from server
    getAnnotations() {
        if (this.labeling_files.indexOf(this.fileList[this.curFile]) == -1) {
            this.labeling_files.push(this.fileList[this.curFile])
            var res = [];
            var fileName = this.fileList[this.curFile] + ".txt";
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", this.workBlob + '/Annotations/' + fileName + '?' + new Date().getTime(), false);
            rawFile.onreadystatechange = function() {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status == 0) {
                        var allText = rawFile.responseText;
                        var str_list = allText.split("\n");
                        str_list.pop();
                        for (var i = 0; i < str_list.length; i++) {
                            var str = str_list[i].split(" ");
                            if (str.length == 16) {
                                res.push({
                                    label: str[0],
                                    truncated: str[1],
                                    occluded: str[2],
                                    alpha: str[3],
                                    left: str[4],
                                    top: str[5],
                                    right: str[6],
                                    bottom: str[7],
                                    height: str[8],
                                    width: str[9],
                                    length: str[10],
                                    x: str[11],
                                    y: str[12],
                                    z: str[13],
                                    rotation_y: str[14]
                                });
                            }
                        }
                    }
                }
            }
            rawFile.send(null);
            this.loadAnnotations(res);
        } else {
            this.loadAnnotations(this.results[this.curFile]);
        }
    }

    // Output annotations
    setAnnotations() {
        this.pending = true;
        if (this.dataType == "JPEG") {
            textBox.value = "Sending... plz do nothing.";
        }
        var annotations = this.packAnnotations();
        this.results[this.curFile] = annotations;
    }
    ///*
    download(curFile) {
        var fileName = this.fileList[curFile] + ".txt"
        var json = this.results[curFile];
        //alert(this.results);
        var bboxes = ";"; // full text
        bboxes += fileName + ";";
        // for each bbox to be saved
        for (var i = 0; i < this.results[curFile].length; i++) {
            // create a string for the bbox
            var bboxObj = this.results[curFile][i]; // JavaScript Object
            var bbox = ""; // each line of the text file
            var sf = 6;
            for (var key in bboxObj) {
                if (!Number.isInteger(bboxObj[key]) && typeof bboxObj[key] != 'string') {
                    bbox += String(bboxObj[key].toPrecision(sf)) + " ";
                } else {
                    bbox += String(bboxObj[key]) + " ";
                }
            }
            // to add the extra "1.0" that is currently in the annotations files, representing the score
            bbox += "1.0"; //str is completed
            bboxes += bbox + ";";
        }
        // bboxes is completed, time to replace the file

        var fileToSave = new XMLHttpRequest();
        fileToSave.open("POST", '/', true);
        fileToSave.setRequestHeader("Content-Type", 'text/plain');
        fileToSave.onreadystatechange = function() {
            if (fileToSave.readyState == XMLHttpRequest.DONE && fileToSave.status == 200) {
                // Request finished. Do processing here.
                alert("Frame " + curFile + " Saved!");
            }
        }
        fileToSave.send(bboxes);
    }
    //*/

    previousFile() {
        if (this.curFile > 0) {
            this.hold_flag = false;
            this.setAnnotations();
            this.download(this.curFile);
            this.curFile--;
            this.onChangeFile();
        }
    }

    nextFile() {
        if (this.curFile < this.fileList.length - 1) {
            this.setAnnotations();
            this.download(this.curFile);
            this.curFile++;
            this.onChangeFile();
        }
    }

    saveFile() {
        //if (this.curFile < this.fileList.length-1) {
        this.setAnnotations();
        this.download(this.curFile);
        //}
    }

    jumpFile(value) {
        if (0 <= value && value <= this.fileList.length - 1) {
            this.hold_flag = false;
            this.setAnnotations();
            this.download(this.curFile);
            this.curFile = value;
            this.onChangeFile();
        }
        else {
            this.hold_flag = false;
            this.setAnnotations();
            this.download(this.curFile);
            this.onChangeFile();
        }
    }

    onChangeFile() {
        if (this.dataType == "JPEG") {
            imageBox.value = (this.curFile + 1) + "/" + this.fileList.length; //TODO
        }
        ground_mesh.visible = false;
        image_array[0].visible = false;
        this.showData();
    }

    // Archive and update database // code that is not being used
    archiveWorkFiles() {
        this.setAnnotations();

        alert("Updated database!")
    }
}
