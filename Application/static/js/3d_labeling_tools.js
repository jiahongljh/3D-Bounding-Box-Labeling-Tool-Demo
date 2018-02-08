var canvas2D, canvas2D_static, canvas3D_side, stats, image_2d, ctx;
var camera, controls, scene, renderer;
var cube;
var keyboard = new KeyboardState();
var numbertag_list = [];
var gui_tag = [];
var gui = new dat.GUI();
var CameraExMat = [];
var CameraMat = [];
var identityMat = [[1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]];
var cube_array = [];
var bb1 = [];
var folder_position = [];
var folder_size = [];
var bbox_flag = true;
var click_flag = false;
var click_object_index = 0;
var mouse_down = {
    x: 0,
    y: 0
};
var mouse_up = {
    x: 0,
    y: 0
};
var click_point = THREE.Vector3();
var click_plane_array = []
var attribute = ["car", "bus", "van", "truck", "pedestrian", "cyclist", "motorcyclist"];
var occludedValue = ["0", "1", "2", "3"]
var truncatedValue = ["0", "1"]
var input_filename = 'input';
var now_flame = 0;
var ground_mesh;
var image_array = [];
var bird_view_flag = false;
var widthRatio = 0.75;
var sample = '';//'_sample'; // either '_sample' or ''
var JPEGImagesdir = '/JPEGImages' + sample + '/';
var PCDPointsdir = '/PCDPoints' + sample + '/';

var parameters = {
    i: -1,
    flame: now_flame,
    image_checkbox: false,
    StaticSideImage_checkbox: true,
    //DynamicSideImage_checkbox : false,
    addbboxpara: function() {
        var init_parameters = {
            x: 1,
            y: 0,
            z: -1.5,
            delta_x: 0,
            delta_y: 0,
            delta_z: 0,
            width: 0.5,
            height: 0.5,
            depth: 0.5,
            yaw: 0,
            numbertag: parameters.i + 1,
            label: attribute[0],
            occluded: occludedValue[3],
            truncated: truncatedValue[0]
        };
        addbbox(init_parameters);
        gui_reset_tag();
    },
    next: function() {
        workspace.nextFile();
    },
    before: function() {
        workspace.previousFile();
    },
    save: function() {
        workspace.saveFile();
    },
    project_to_image: function() {
        projectToImage();
    },
    hold_bbox_flag: false,
    bird_view: function() {
        bird_view();
    },
    camera_view: function() {
        camera_view();
    },
    update_database: function() {
        workspace.archiveWorkFiles();
    }
    //,result: function() {result(1,cube_array);}
}



function isEven(value) {
    if (value % 2 == 0)
        return true;
    else
        return false;
}

function chooseNum(PCDNum, start, end, that) {
    var startNum = parseInt(that.JPEGNumsList[start].substr(6), 10);
    var endNum = parseInt(that.JPEGNumsList[end].substr(6), 10);
    // 084(.)747000 // 9500000
    //camera-000000-1504861084.747
    // if start is smaller or equal
    if (PCDNum - startNum <= endNum - PCDNum) {
        // if start is valid
        if (isEven(parseInt(that.JPEGFileList[start].split('-')[1], 10))) {
            return start;
        }
        // if end (second closest) is valid
        else if (isEven(parseInt(that.JPEGFileList[end].split('-')[1], 10))) {
            return end;
        }
        // neither is valid, expand search outwards
        else {
            return chooseNum(PCDNum, start - 1, end + 1, that);
        }
    }
    // if end is smaller
    else {
        // if end is valid
        if (isEven(parseInt(that.JPEGFileList[end].split('-')[1], 10))) {
            return end;
        }
        // if start (second closest) is valid
        else if (isEven(parseInt(that.JPEGFileList[start].split('-')[1], 10))) {
            return start;
        }
        // neither is valid, expand search outwards
        else {
            return chooseNum(PCDNum, start - 1, end + 1, that);
        }
    }
}


function closestNum(PCDNum, that) {
    var start = 0;
    var end = that.JPEGNumsList.length - 1;
    var mid = Math.floor((end + start) / 2);
    while (end - start >= 2) {
        if (PCDNum < that.JPEGNumsList[mid]) {
            end = mid;
            mid = Math.floor((end + start) / 2);
        } else if (PCDNum > that.JPEGNumsList[mid]) {
            start = mid;
            mid = Math.floor((end + start) / 2);
        } else if (PCDNum == that.JPEGNumsList[mid]) {
            return mid;
        }
    }
    // if not returned yet, there are 2 numbers to check
    return chooseNum(parseInt(PCDNum.substr(6), 10), start, end, that);
}

// Visualize 2d and 3d data
WorkSpace.prototype.showData = function() {
    parameters.flame = this.curFile;
    currentFrame = parameters.flame;
    // pcd_1504861088535321
    console.log("Frame " + currentFrame);
    var PCDNum = this.fileList[this.curFile].split('pcd_')[1];
    var JPEGIndex = closestNum(PCDNum, this);
    //var JPEGIndex = this.curFile;
    var img_url = this.workBlob +  JPEGImagesdir +
        this.JPEGFileList[JPEGIndex] + '.jpg' + '?' + new Date().getTime();
    console.log(this.fileList[this.curFile].substring(0,14) + '.' + this.fileList[this.curFile].substr(14) + '.pcd' + ' used');
    console.log(this.JPEGFileList[JPEGIndex] + '.jpg' + ' used');
    console.log(this.JPEGNumsList[JPEGIndex]);

    var textloader = new THREE.TextureLoader();
    textloader.crossOrigin = '';
    var image = textloader.load(img_url);
    image.minFilter = THREE.LinearFilter;
    // image is put in, over here
    var material = new THREE.MeshBasicMaterial({
        map: image,
        transparent: true,
        opacity: 0.7
    });
    var planeWidth = 2;
    var geometry = new THREE.PlaneGeometry(planeWidth, planeWidth*3/4);
    var image_plane = new THREE.Mesh(geometry, material);
    var pcd_loader = new THREE.PCDLoader();
    var pcd_url = this.workBlob + PCDPointsdir +
        this.fileList[this.curFile] + '.pcd' + '?' + new Date().getTime();
    var oldFile = this.curFile;
    var that = this;
    pcd_loader.load(pcd_url, function(mesh) {
        if (oldFile == that.curFile) {
            scene.add(mesh);
            ground_mesh = mesh;
            /* var center = mesh.geometry.boundingSphere.center;*/
        }
    });
    var image_mat = MaxProd(identityMat, [2.8, -0.3, -0.5, 1]);//[2.8, -0.3, -0.5, 1]);
    image_plane.position.x = image_mat[0];
    image_plane.position.y = image_mat[1];
    image_plane.position.z = image_mat[2];
    image_plane.rotation.y = -Math.PI / 2;
    image_plane.rotation.x = Math.PI / 2;
    image_plane.rotation.z = Math.PI;
    scene.add(image_plane);
    image_array = [];
    image_array.push(image_plane);
    image_2d = new Image();
    image_2d.crossOrigin = 'Anonymous';
    image_2d.src = this.workBlob + JPEGImagesdir + this.JPEGFileList[JPEGIndex] + '.jpg?' + new Date().getTime();
    /*
	defaultImage =  new Image();
	defaultImage.crossOrigin = 'Anonymous';
	defaultImage.src = this.workBlob + '/JPEGImages_sample/'+ 'default.jpg';*/
    /*defaultImage.onload = function() {
    	canvas2D_static.width = defaultImage.width;
    	canvas2D_static.height = defaultImage.height;
    	//canvas2D_static.getContext('2d').drawImage(defaultImage, 0, 0);
    }*/
    image_2d.onload = function() {
        canvas2D_static.width = image_2d.width;
        canvas2D_static.height = image_2d.height;
        canvas2D_static.getContext('2d').save();
        canvas2D_static.getContext('2d').translate(canvas2D_static.width / 2, canvas2D_static.height / 2);
        canvas2D_static.getContext('2d').rotate(Math.PI);
        canvas2D_static.getContext('2d').drawImage(image_2d, -canvas2D_static.width / 2, -canvas2D_static.height / 2);
        canvas2D_static.getContext('2d').restore();
    }

    if (parameters.image_checkbox == false) {
        image_array[0].visible = false;
        //image_array[1].visible = false;
    }
    /*
	if(parameters.DynamicSideImage_checkbox==false){
	image_array[1].visible = false;
    }
	*/
    if (parameters.StaticSideImage_checkbox == false) {
        canvas2D_static.style.display = "none";
    }


    if (this.hold_flag == false) {
        for (var k = 0; k < parameters.i + 1; k++) {
            gui.removeFolder('BoundingBox' + String(k));
            cube_array[k].visible = false;
        }
        this.originalBboxes = [];
        this.bboxes = [];
        cube_array = [];
        numbertag_list = [];
        bb1 = [];
        gui_tag = [];
        numbertag_list = [];
        folder_position = [];
        folder_size = [];
        parameters.i = -1;
        this.getAnnotations();
    }
    parameters.hold_bbox_flag = false;
    this.hold_flag = false;
    for (var i in gui.__controllers) {
      gui.__controllers[i].updateDisplay();
    }
}

// Set values to this.bboxes from annotations
WorkSpace.prototype.loadAnnotations = function(annotations) {
    this.bboxes = [];
    for (var i in annotations) {
        if (i != "remove") {
            var readfile_mat =
                MaxProd(identityMat/*CameraExMat*/, [parseFloat(annotations[i].x),
                    parseFloat(annotations[i].y),
                    parseFloat(annotations[i].z),
                    1
                ]);
            var width_tmp = parseFloat(annotations[i].width);
            var height_tmp = parseFloat(annotations[i].height);
            var depth_tmp = parseFloat(annotations[i].length);
            var truncated_tmp = parseFloat(annotations[i].truncated);
            var occluded_tmp = parseFloat(annotations[i].occluded);
            if (width_tmp == 0.0) {
                width_tmp = 0.0001
            }
            if (height_tmp == 0.0) {
                height_tmp = 0.0001
            }
            if (depth_tmp == 0.0) {
                depth_tmp = 0.0001
            }

            var readfile_parameters = {
                x: readfile_mat[0],
                y: -readfile_mat[1],
                z: readfile_mat[2],
                delta_x: 0,
                delta_y: 0,
                delta_z: 0,
                width: width_tmp,
                height: height_tmp,
                depth: depth_tmp,
                yaw: parseFloat(annotations[i].rotation_y),
                numbertag: parameters.i + 1,
                label: annotations[i].label,
                truncated: truncated_tmp,
                occluded: occluded_tmp
            };
            addbbox(readfile_parameters);
        }
    }
    this.originalBboxes = this.bboxes.concat();
    /* main();*/
    gui_add_tag();
}

// Create annotations from this.bboxes
WorkSpace.prototype.packAnnotations = function() {
    var annotations = [];
    for (var i = 0; i < this.bboxes.length; ++i) {
        // only save the bbox if it is visible i.e. not deleted
        if (cube_array[i].visible == true) {
            var result_mat = MaxProd(identityMat, [cube_array[i].position.x, cube_array[i].position.y, cube_array[i].position.z, 1]);
            //TODO BoundingBox Number Tag workspace.bboxes[i].numbertag
            var bbox = this.bboxes[i];
            // NOTE: alpha, left, top, right, bottom are not used in the software at the moment
            annotations.push({
                label: workspace.bboxes[i].label,
                truncated: workspace.bboxes[i].truncated,
                occluded: workspace.bboxes[i].occluded,
                alpha: 0, //Calculate by Python script
                left: 0, //TODO please input image feature
                top: 0, //TODO
                right: 0, //TODO
                bottom: 0, //TODO
                height: cube_array[i].scale.y,
                width: cube_array[i].scale.x,
                length: cube_array[i].scale.z,
                x: result_mat[0],
                y: result_mat[1],
                z: result_mat[2],
                rotation_y: cube_array[i].rotation.z
            });
        }
    }
    return annotations;
}

var workspace = new WorkSpace("PCD");

//add remove function in dat.GUI
dat.GUI.prototype.removeFolder = function(name) {
    var folder = this.__folders[name];
    if (!folder) {
        return;
    }

    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
}


/* if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
 * init();
 * animate();*/


//read local calibration file.
function readYAMLFile(filename) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                for (var i = 0; i < allText.split("\n").length; i++) {
                    if (allText.split("\n")[i].split(":")[0].trim() == 'data') {
                        CameraExMat = [
                            [parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[0]), parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[1]), parseFloat(allText.split("\n")[i + 1].trim().split(",")[0]), parseFloat(allText.split("\n")[i + 1].trim().split(",")[1])],
                            [parseFloat(allText.split("\n")[i + 2].trim().split(",")[0]), parseFloat(allText.split("\n")[i + 2].trim().split(",")[1]), parseFloat(allText.split("\n")[i + 3].trim().split(",")[0]), parseFloat(allText.split("\n")[i + 3].trim().split(",")[1])],
                            [parseFloat(allText.split("\n")[i + 4].trim().split(",")[0]), parseFloat(allText.split("\n")[i + 4].trim().split(",")[1]), parseFloat(allText.split("\n")[i + 5].trim().split(",")[0]), parseFloat(allText.split("\n")[i + 5].trim().split(",")[1])],
                            [0, 0, 0, 1]
                        ];

                        CameraMat = [
                            [parseFloat(allText.split("\n")[i + 10].split(":")[1].split("[")[1].split(",")[0]), parseFloat(allText.split("\n")[i + 10].split(":")[1].split("[")[1].split(",")[1]), parseFloat(allText.split("\n")[i + 10].split(":")[1].split("[")[1].split(",")[2])],

                            [parseFloat(allText.split("\n")[i + 10].split(":")[1].split("[")[1].split(",")[3]), parseFloat(allText.split("\n")[i + 11].trim().split(",")[0]), parseFloat(allText.split("\n")[i + 11].trim().split(",")[1])],

                            [parseFloat(allText.split("\n")[i + 11].trim().split(",")[2]), parseFloat(allText.split("\n")[i + 11].trim().split(",")[3]), parseFloat(allText.split("\n")[i + 11].trim().split(",")[4])]
                        ];
                        break
                    }
                }
            }
        }
    }

    rawFile.send(null);
}

//calicurate inverse matrix
function invMax(inMax) {
    var a = new Array(4);
    for (i = 0; i < 4; i++) {
        a[i] = new Array(4);
        for (j = 0; j < 4; j++) {
            a[i][j] = inMax[i][j];
        }
    }
    var c = a.length;
    var buf;
    var i, j, k;
    var inv = new Array(c);
    for (i = 0; i < c; i++) {
        inv[i] = new Array(c);
        for (j = 0; j < c; j++) {
            inv[i][j] = (i == j) ? 1.0 : 0.0;
        }
    }

    for (i = 0; i < c; i++) {
        buf = 1 / a[i][i];
        for (j = 0; j < c; j++) {
            a[i][j] *= buf;
            inv[i][j] *= buf;
        }

        for (j = 0; j < c; j++) {
            if (i != j) {
                buf = a[j][i];
                for (k = 0; k < c; k++) {
                    a[j][k] -= a[i][k] * buf;
                    inv[j][k] -= inv[i][k] * buf;
                }
            }
        }
    }

    return inv;
}

//calicurate prod of matrix
function MaxProd(inMax1, inMax2) {
    var outMax = [0, 0, 0, 0];
    outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
    outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
    outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
    outMax[3] = inMax1[3][0] * inMax2[0] + inMax1[3][1] * inMax2[1] + inMax1[3][2] * inMax2[2] + inMax1[3][3] * inMax2[3];
    return outMax
}

//load pcd data and image data
function data_load() {
    workspace.showData;
}

//change camera position to bird view position
function bird_view() {
    camera.position.set(0, 0, 15);
    camera.up.set(1, 0, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.target.set(0, 0, 0);
    bird_view_flag = true;
    parameters.image_checkbox = false;
    image_array[0].visible = false;
    parameters.StaticSideImage_checkbox = true;
    canvas2D_static.style.display = "block";
    document.getElementById('canvas3d').style.left = "25%";
    widthRatio = 0.75;
    //parameters.DynamicSideImage_checkbox = true;
    onWindowResize();
}

//change camera position to initial position
function camera_view() {
    camera.position.set(0, -0.1, 0);
    camera.up.set(0, 0, 1);
    camera.lookAt(new THREE.Vector3(1, 0, 0));
    controls.target.set(1, 0, 0);
    parameters.image_checkbox = true;
    image_array[0].visible = true;
    parameters.StaticSideImage_checkbox = true;
    canvas2D_static.style.display = "block";
    document.getElementById('canvas3d').style.left = "25%";
    widthRatio = 0.75;
    //parameters.DynamicSideImage_checkbox = true;
    bird_view_flag = false;
    onWindowResize();
}

//add new bounding box
function addbbox(read_parameters) {
    workspace.bboxes.push(read_parameters);
    var tmp_parameters = {
        x: read_parameters.x,
        y: read_parameters.y,
        z: read_parameters.z,
        delta_x: read_parameters.delta_x,
        delta_y: read_parameters.delta_y,
        delta_z: read_parameters.delta_z,
        width: read_parameters.width,
        height: read_parameters.height,
        depth: read_parameters.depth,
        yaw: read_parameters.yaw,
        numbertag: read_parameters.numbertag,
        label: read_parameters.label,
        truncated: read_parameters.truncated,
        occluded: read_parameters.occluded
    };
    workspace.originalBboxes.push(tmp_parameters);
    parameters.i = 1 + parameters.i;
    var num = parameters.i;
    var bbox = workspace.bboxes[num];
    var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);
    var cubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x008866,
        wireframe: true,
        wireframeLinewidth : 1
    });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(bbox.x, -bbox.y, bbox.z);
    cube.scale.set(bbox.width, bbox.height, bbox.depth);
    cube.rotation.z = bbox.yaw;
    scene.add(cube);
    cube_array.push(cube);
    addbbox_gui(num);
}

//register now bounding box
function addbbox_gui(num) {
    var bb = gui.addFolder('BoundingBox' + String(num));
    var bbox = workspace.bboxes[num];
    bb1.push(bb);
    var folder1 = bb1[num].addFolder('Position');
    var cubeX = folder1.add(bbox, 'x').min(-50).max(50).step(0.01); //.listen();
    var cube_delta_X = folder1.add(bbox, 'delta_x').min(-2).max(2).step(0.01); //.listen();
    var cubeY = folder1.add(bbox, 'y').min(-30).max(30).step(0.01); //.listen();
    var cube_delta_Y = folder1.add(bbox, 'delta_y').min(-2).max(2).step(0.01); //.listen();
    var cubeZ = folder1.add(bbox, 'z').min(-3).max(10).step(0.01); //.listen();
    var cube_delta_Z = folder1.add(bbox, 'delta_z').min(-2).max(2).step(0.01); //.listen();
    var cubeYaw = folder1.add(bbox, 'yaw').min(-Math.PI / 2).max(Math.PI / 2).step(0.01); //.listen();
    folder1.close();
    folder_position.push(folder1);
    var folder2 = bb1[num].addFolder('Size');
    var cubeW = folder2.add(bbox, 'width').min(0).max(10).step(0.01); //.listen();
    var cubeH = folder2.add(bbox, 'height').min(0).max(10).step(0.01); //.listen();
    var cubeD = folder2.add(bbox, 'depth').min(0).max(10).step(0.01); //.listen();
    folder2.close();
    folder_size.push(folder2);
    cubeX.onChange(function(value) {
        cube_array[num].position.x = value;
    });
    cubeY.onChange(function(value) {
        cube_array[num].position.y = -value;
    });
    cubeZ.onChange(function(value) {
        cube_array[num].position.z = value;
    });
    cube_delta_X.onChange(function(value) {
        cube_array[num].position.x = bbox.x + value;
    });
    cube_delta_Y.onChange(function(value) {
        cube_array[num].position.y = -bbox.y - value;
    });
    cube_delta_Z.onChange(function(value) {
        cube_array[num].position.z = bbox.z + value;
    });
    cubeYaw.onChange(function(value) {
        cube_array[num].rotation.z = value;
    });
    cubeW.onChange(function(value) {
        cube_array[num].scale.x = value;
    });
    cubeH.onChange(function(value) {
        cube_array[num].scale.y = value;
    });
    cubeD.onChange(function(value) {
        cube_array[num].scale.z = value;
    });
    var reset_parameters = {
        reset: function() {
            resetCube(num);
        },
        delete: function() {
            gui.removeFolder('BoundingBox' + String(num));
            cube_array[num].visible = false;
        }
    };

    numbertag_list.push(num);
    labeltag = bb1[num].add(bbox, 'label', attribute).name("Attribute");
    occludedtag = bb1[num].add(bbox, 'occluded', occludedValue).name("OccludedValue");
    truncatedtag = bb1[num].add(bbox, 'truncated', truncatedValue).name("TruncatedValue");
    bb1[num].add(reset_parameters, 'reset').name("Reset");
    bb1[num].add(reset_parameters, 'delete').name("Delete");

}

//add gui number tag to integrate 2d labeling result
function gui_add_tag() {
    for (var i = 0; i < numbertag_list.length; i++) {
        tag = bb1[i].add(workspace.bboxes[i], 'numbertag', numbertag_list).name("BoundingBoxTag");
        gui_tag.push(tag)
    }
}

//update gui number tag to integrate 2d labeling result
function gui_reset_tag() {
    for (var i = 0; i < numbertag_list.length - 1; i++) {
        bb1[i].remove(gui_tag[i]);
    }

    gui_tag = [];
    for (var i = 0; i < numbertag_list.length; i++) {
        tag = bb1[i].add(workspace.bboxes[i], 'numbertag', numbertag_list).name("BoundingBoxTag");
        gui_tag.push(tag)
    }
}

//reset cube patameter and position
function resetCube(num) {
    workspace.bboxes[num].x = workspace.originalBboxes[num].x;
    workspace.bboxes[num].y = workspace.originalBboxes[num].y;
    workspace.bboxes[num].z = workspace.originalBboxes[num].z;
    workspace.bboxes[num].yaw = workspace.originalBboxes[num].yaw;
    workspace.bboxes[num].delta_x = workspace.originalBboxes[num].delta_x;
    workspace.bboxes[num].delta_y = workspace.originalBboxes[num].delta_y;
    workspace.bboxes[num].delta_z = workspace.originalBboxes[num].delta_z;
    workspace.bboxes[num].width = workspace.originalBboxes[num].width;
    workspace.bboxes[num].height = workspace.originalBboxes[num].height;
    workspace.bboxes[num].depth = workspace.originalBboxes[num].depth;
    cube_array[num].position.x = workspace.bboxes[num].x;
    cube_array[num].position.y = -workspace.bboxes[num].y;
    cube_array[num].position.z = workspace.bboxes[num].z;
    cube_array[num].rotation.z = workspace.bboxes[num].yaw;
    cube_array[num].scale.x = workspace.bboxes[num].width;
    cube_array[num].scale.y = workspace.bboxes[num].height;
    cube_array[num].scale.z = workspace.bboxes[num].depth;
}

//change window size
function onWindowResize() {
    camera.aspect = widthRatio * window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * widthRatio, window.innerHeight);
    //canvas3D_side.style.top = String(55+window.innerWidth*0.25*image_2d.height/image_2d.width)+"px";
}

//drow animation
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    keyboard.update();

    if (keyboard.down("shift")) {
        controls.enabled = true;
        bbox_flag = false;
    }

    if (keyboard.up("shift")) {
        controls.enabled = false;
        bbox_flag = true;
    }

    controls.update();
    stats.update();
    for (var i = 0; i < numbertag_list.length; i++) {
        if (bb1[i].closed == false) {
            cube_array[i].material.color.setHex(0xff0000);
            folder_position[i].open();
            folder_size[i].open();
        }

        if (bb1[i].closed == true) {
            cube_array[i].material.color.setHex(0x008866);
        }
    }
}

function matrixTranslation(vector, translation, factor) {
    var a1 = vector.length;
    var a2 = vector[0].length;
    for (var i = 0; i < vector.length; ++i) {
        for (var j = 0; j < vector[i].length; ++j) {
            vector[i][j] += factor * translation[i][j];
        }
    }
    return vector;
}

function vectorTranslation(vector, translation, factor) {
    var a1 = vector.length;
    var a2 = vector[0].length;
    for (var i = 0; i < vector.length; ++i) {
        vector[i] += factor * translation[i];
    }
    return vector;
}



function vectorRotation(vector, kx, ky, kz, yaw) {
    // uses rodrigues rotation formula
    var K = [
        [0, -kz, ky],
        [kz, 0, -kx],
        [-ky, kx, 0]
    ];
    var K2 = [
        [-(kz * kz + ky * ky), ky * kx, kz * kx],
        [ky * kx, -(kz * kz + kx * kx), kz * ky],
        [-kx * kz, kz * ky, -(ky * ky + kx * kx)]
    ];
    var I = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    // R = I + sin(yaw)K + (1-cos(yaw))K^2
    var R = matrixTranslation(I, K, Math.sin(yaw));
    R = matrixTranslation(R, K2, 1 - Math.cos(yaw));
    // result = Rv
    var result = [0, 0, 0];
    for (var row = 0; row < R.length; ++row) {
        for (var column = 0; column < vector.length; ++column) {
            result[row] += R[row][column] * vector[column];
        }
    }

    return result;
}

function vectorConversion(vector, mat) {
  var tempVec = [vector[0], vector[1], vector[2], 1]; //[x, -y, z, 1] using display basis vectors, reasons for -y: because when displayed, the y is flipped
  tempVec = MaxProd(mat, tempVec); // [y, z, x, 1] using display basis vectors, which follows X, Y, Z convention
  vector = [tempVec[0], tempVec[1], tempVec[2]]; //[X, Y, Z] convention
    //console.log(tempVec);
  return vector;
}

function vertexDerivation(centroid, x, y, z, w, h, l, yaw) {
    w /= 2;
    h /= 2;
    l /= 2;
    var vector = [centroid[0] + x * w, centroid[1] + y * h, centroid[2] + z * l];
    // vector is in x, y, z
    vector = vectorTranslation(vector, centroid, -1);
    //var vector1 = [vector[1], -vector[2], vector[0]]; // y, -z,
    vector = vectorRotation(vector, 0, 0, 1, yaw);
    //vector = [vector1[2], vector1[0], -vector1[1]];
    vector = vectorTranslation(vector, centroid, 1);
    vector = vectorConversion(vector, CameraExMat);
    return vector;
}



function calculateBboxVertices() {
    bboxesVertices = [];
    //for each bbox
    for (var i = 0; i < workspace.bboxes.length; ++i) {
        // only calculate if bbox is visible i.e. not deleted
        if (cube_array[i].visible == true) {
            var xCentre = cube_array[i].position.x;
            var yCentre = cube_array[i].position.y;
            var zCentre = cube_array[i].position.z;
            var centroid = [xCentre, yCentre, zCentre];
            var yaw = cube_array[i].rotation.z;
            var height = cube_array[i].scale.y;
            var width = cube_array[i].scale.x;
            var length = cube_array[i].scale.z;
            // calculations
            var v0 = vertexDerivation(centroid, -1, -1, -1, width, height, length, yaw);
            var v1 = vertexDerivation(centroid, -1, 1, -1, width, height, length, yaw);
            var v2 = vertexDerivation(centroid, -1, -1, 1, width, height, length, yaw);
            var v3 = vertexDerivation(centroid, -1, 1, 1, width, height, length, yaw);
            var v4 = vertexDerivation(centroid, 1, -1, -1, width, height, length, yaw);
            var v5 = vertexDerivation(centroid, 1, 1, -1, width, height, length, yaw);
            var v6 = vertexDerivation(centroid, 1, -1, 1, width, height, length, yaw);
            var v7 = vertexDerivation(centroid, 1, 1, 1, width, height, length, yaw);
            var ar = [v0, v1, v2, v3, v4, v5, v6, v7];
            // save into bboxesVertices
            bboxesVertices.push(ar);
        }
    }
    return bboxesVertices;
}

function drawLine(a, b, ctx) {
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = "#2dfbff";// green: "#7FFF00";
    ctx.lineWidth=3.5;
    ctx.stroke();
}

function projectToImage() {
    var bboxesVertices = calculateBboxVertices();
    //console.log(bboxesVertices);
    // bboxesVertices[i] contains ith bbox, and each bbox contains 8 vertices numbered 0 to 7 with the sides being 0-1, 0-2, 0-4, 1-3, 1-5, 2-3, 2-6, 3-7, 4-5, 4-6, 5-7, 6-7, and each vertex is an array [x,y,z]
    // z against y axis, x is the axis which represents the "depth" or direction of car travel
    var sides = [
        [0, 1],
        [0, 2],
        [0, 4],
        [1, 3],
        [1, 5],
        [2, 3],
        [2, 6],
        [3, 7],
        [4, 5],
        [4, 6],
        [5, 7],
        [6, 7]
    ];
    var canvasWidth = canvas2D_static.width;
    var canvasHeight = canvas2D_static.height;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.translate(canvas2D_static.width / 2, canvas2D_static.height / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(image_2d, -canvas2D_static.width / 2, -canvas2D_static.height / 2);
    ctx.restore();

    var focalLength = CameraMat[0][0] / 2 + CameraMat[1][1] / 2;
    var xOffset = CameraMat[0][2];
    var yOffset = CameraMat[1][2];
    if (sample == '') {
      xOffset = 642;
      yOffset = 285;
    }
    // translate ctx
    ctx.save();
    //ctx.translate(canvasWidth/2, canvasHeight/2);
    ctx.translate(xOffset, yOffset); // +x means shifts right, +y means shift down

    // for each bbox
    for (var i = 0; i < bboxesVertices.length; ++i) {
        var bbox = []
        // for each vertex in the bbox
        for (var j = 0; j < bboxesVertices[i].length; ++j) {
            // find x,y coords of each vertex with conventionally defined x and y axes in a mathematical sense
            // x = f * y/x
            // y = f* z / x
            var x = null;
            var y = null;
            //if (bboxesVertices[i][j][0] > 0) {
              x = focalLength * bboxesVertices[i][j][0] / bboxesVertices[i][j][2];
              y = -focalLength * bboxesVertices[i][j][1] / bboxesVertices[i][j][2]; // negative because the y axis is defined as going down, not up
              if (sample == '_sample') {
                y = -y;
              }
              //console.log("BBox" + i + ", V" + j + ":    " + "x = " + parseInt(x+xOffset) + ",    y = " + parseInt(y+yOffset));
            //}
            // calibrate the x, y so it works with the top-left is [0,0] coordinate system
            /*x = xOffset/2 + x;
            y = yOffset/2 + y;*/
            var ar = [x, y];
            bbox.push(ar);

        }
        // x,y coords of all bbox vertices are derived
        // draw all the lines

        ctx.beginPath();
        for (var k = 0; k < sides.length; ++k) {
          if (bbox[sides[k][0]][0] != null && bbox[sides[k][0]][1] !=null && bbox[sides[k][1]][0] != null && bbox[sides[k][1]][1] != null){
            drawLine(bbox[sides[k][0]], bbox[sides[k][1]], ctx);
          }
        }
        ctx.closePath();
    }

    ctx.restore();

}

function init() {
    scene = new THREE.Scene();
    var axisHelper = new THREE.AxisHelper(0.1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);
    camera = new THREE.PerspectiveCamera(90, widthRatio * window.innerWidth / window.innerHeight, 0.01, 10000);
    camera.rotation.z = Math.PI/2;
    camera.position.set(0, -0.1, 0);//(0, -0.1, 0);(1.5,-1,0.5)

    camera.up.set(0, 0, 1);


    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth * widthRatio, window.innerHeight);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.5;
    controls.panSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    controls.minDistance = 0.3;
    controls.maxDistance = 0.3 * 100;
    controls.noKey = true;
    controls.enabled = false;
    scene.add(camera);
    controls.target.set(1, 0, 0);
    controls.update();
    var canvas3D = document.getElementById('canvas3d');
    canvas3D.appendChild(renderer.domElement);
    stats = new Stats();
    canvas3D.appendChild(stats.dom);


    window.addEventListener('resize', onWindowResize, false);

    window.onmousedown = function(ev) {
        if (bbox_flag == true) {
            if (ev.target == renderer.domElement) {
                var rect = ev.target.getBoundingClientRect();
                mouse_down.x = ev.clientX - rect.left;
                mouse_down.y = ev.clientY - rect.top;
                mouse_down.x = (mouse_down.x / window.innerWidth) * 2 - 1;
                mouse_down.y = -(mouse_down.y / window.innerHeight) * 2 + 1;
                var vector = new THREE.Vector3(mouse_down.x, mouse_down.y, 1);
                vector.unproject(camera);
                var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                var click_object = ray.intersectObjects(cube_array);
                if (click_object.length > 0) {
                    click_flag = true;
                    click_object_index = cube_array.indexOf(click_object[0].object);
                    click_point = click_object[0].point;
                    click_cube = cube_array[click_object_index];
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        wireframe: false,
                        transparent: true,
                        opacity: 0.0
                    });
                    var geometry = new THREE.PlaneGeometry(200, 200);
                    var click_plane = new THREE.Mesh(geometry, material);
                    click_plane.position.x = click_point.x;
                    click_plane.position.y = click_point.y;
                    click_plane.position.z = click_point.z;
                    var normal = click_object[0].face;
                    if ([normal.a, normal.b, normal.c].toString() == [6, 3, 2].toString() || [normal.a, normal.b, normal.c].toString() == [7, 6, 2].toString()) {
                        click_plane.rotation.x = Math.PI / 2;
                        click_plane.rotation.y = cube_array[click_object_index].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [6, 7, 5].toString() || [normal.a, normal.b, normal.c].toString() == [4, 6, 5].toString()) {
                        click_plane.rotation.x = -Math.PI / 2;
                        click_plane.rotation.y = -Math.PI / 2 - cube_array[click_object_index].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [0, 2, 1].toString() || [normal.a, normal.b, normal.c].toString() == [2, 3, 1].toString()) {
                        click_plane.rotation.x = Math.PI / 2;
                        click_plane.rotation.y = Math.PI / 2 + cube_array[click_object_index].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [5, 0, 1].toString() || [normal.a, normal.b, normal.c].toString() == [4, 5, 1].toString()) {
                        click_plane.rotation.x = -Math.PI / 2;
                        click_plane.rotation.y = -cube_array[click_object_index].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [3, 6, 4].toString() || [normal.a, normal.b, normal.c].toString() == [1, 3, 4].toString()) {
                        click_plane.rotation.y = -Math.PI
                    }
                    scene.add(click_plane);
                    click_plane_array.push(click_plane);
                }
            }
        }
    }

    window.onmouseup = function(ev) {
        if (bbox_flag == true) {
            var rect = ev.target.getBoundingClientRect();
            mouse_up.x = ev.clientX - rect.left;
            mouse_up.y = ev.clientY - rect.top;
            mouse_up.x = (mouse_up.x / window.innerWidth) * 2 - 1;
            mouse_up.y = -(mouse_up.y / window.innerHeight) * 2 + 1;
            var vector = new THREE.Vector3(mouse_up.x, mouse_up.y, 1);
            vector.unproject(camera);
            var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
            var click_object = ray.intersectObjects(click_plane_array);
            if (click_object.length > 0 && bb1[click_object_index].closed == false) {
                var drag_vector = {
                    x: click_object[0].point.x - click_point.x,
                    y: click_object[0].point.y - click_point.y,
                    z: click_object[0].point.z - click_point.z
                };
                var yaw_drag_vector = {
                    x: drag_vector.x * Math.cos(-cube_array[click_object_index].rotation.z) - drag_vector.y * Math.sin(-cube_array[click_object_index].rotation.z),
                    y: drag_vector.x * Math.sin(-cube_array[click_object_index].rotation.z) + drag_vector.y * Math.cos(-cube_array[click_object_index].rotation.z),
                    z: drag_vector.z
                };
                var judge_click_point = {
                    x: (click_point.x - cube_array[click_object_index].position.x) * Math.cos(-cube_array[click_object_index].rotation.z) - (click_point.y - cube_array[click_object_index].position.y) * Math.sin(-cube_array[click_object_index].rotation.z),
                    y: (click_point.x - cube_array[click_object_index].position.x) * Math.sin(-cube_array[click_object_index].rotation.z) + (click_point.y - cube_array[click_object_index].position.y) * Math.cos(-cube_array[click_object_index].rotation.z)
                };
                workspace.bboxes[click_object_index].width = judge_click_point.x * yaw_drag_vector.x / Math.abs(judge_click_point.x) + workspace.bboxes[click_object_index].width;
                workspace.bboxes[click_object_index].x = drag_vector.x / 2 + workspace.bboxes[click_object_index].x;
                workspace.bboxes[click_object_index].height = judge_click_point.y * yaw_drag_vector.y / Math.abs(judge_click_point.y) + workspace.bboxes[click_object_index].height;
                workspace.bboxes[click_object_index].y = -drag_vector.y / 2 + workspace.bboxes[click_object_index].y;
                workspace.bboxes[click_object_index].depth = (click_point.z - cube_array[click_object_index].position.z) * drag_vector.z / Math.abs((click_point.z - cube_array[click_object_index].position.z)) + workspace.bboxes[click_object_index].depth;
                workspace.bboxes[click_object_index].z = drag_vector.z / 2 + workspace.bboxes[click_object_index].z;
                cube_array[click_object_index].position.x = workspace.bboxes[click_object_index].x;
                cube_array[click_object_index].position.y = -workspace.bboxes[click_object_index].y;
                cube_array[click_object_index].position.z = workspace.bboxes[click_object_index].z;
                cube_array[click_object_index].rotation.z = workspace.bboxes[click_object_index].yaw;
                cube_array[click_object_index].scale.x = workspace.bboxes[click_object_index].width;
                cube_array[click_object_index].scale.y = workspace.bboxes[click_object_index].height;
                cube_array[click_object_index].scale.z = workspace.bboxes[click_object_index].depth;
            }
            if (click_flag == true) {
                click_plane_array = [];
                for (var i = 0; i < bb1.length; i++) {
                    bb1[i].close();
                }
                bb1[click_object_index].open();
                folder_position[click_object_index].open();
                folder_size[click_object_index].open();
            }
        }
    }

    gui.add(parameters, 'addbboxpara').name("AddBoundingBox");
    var currentFrame = gui.add(parameters, 'flame').name("CurrentFrame").min(0).step(1);
    gui.add(parameters, 'next').name("NextFrame");
    gui.add(parameters, 'before').name("PreviousFrame");
    gui.add(parameters, 'save').name("SaveCurrentFrame");
    var HoldCheck = gui.add(parameters, 'hold_bbox_flag').name("Hold").listen();
    //gui.add(parameters, 'update_database').name("UpdateDatabase");
    gui.add(parameters, 'bird_view').name("BirdView");
    gui.add(parameters, 'camera_view').name("CameraView");
    gui.add(parameters, 'project_to_image').name("Project3DTo2D")
    var ImageCheck = gui.add(parameters, 'image_checkbox').name("CentreImage").listen();
    var SideImageCheck_static = gui.add(parameters, 'StaticSideImage_checkbox').name("StaticSideImage").listen();
    //var SideImageCheck_dynamic = gui.add(parameters, 'DynamicSideImage_checkbox').name("DynamicSideImage").listen();
    //gui.add(parameters,'result').name("result");

    readYAMLFile(workspace.workBlob + "/calibration" + sample +".yml");
    data_load(parameters);
    gui.open();
    HoldCheck.onChange(function(value) {
        workspace.hold_flag = value;
    })
    ImageCheck.onChange(function(value) {
        image_array[0].visible = value;
    });

    currentFrame.onChange(function(value) {
        workspace.jumpFile(value);
    });

    SideImageCheck_static.onChange(function(value) {
        if (value == true) {
            canvas2D_static.style.display = "block";
            canvas3D.style.left = "25%";
            widthRatio = 0.75;
            onWindowResize();
        } else {
            canvas2D_static.style.display = "none";
            canvas3D.style.left = "0px";
            widthRatio = 1;
            onWindowResize();
        }
    });

    /*
	SideImageCheck_dynamic.onChange(function(value) {
		//if (value == true)	canvas2D_static.style.display = "block";
		//else canvas2D_static.style.display = "none";
    });
	*/

    //result(0, cube_array, workspace.bboxes)

    //canvas2D = document.getElementById('canvas2d');
    //ctx = canvas2D.getContext('2d');
    //ctx.scale(0.3,0.3);
    /*image_2d = new Image();
    image_2d.crossOrigin = 'Anonymous';
    image_2d.src = workspace.workBlob + '/JPEGImages_sample/' + ('000000' + parameters.flame).slice(-6) + '.jpg?' + new Date().getTime();
    */

    canvas2D_static = document.getElementById('canvas2d_static');
    ctx = canvas2D_static.getContext('2d');
    ctx.scale(1.0, 1.0);
    canvas2D_static.style.display = "block";

    canvas3D_side = document.getElementById('canvas3d_side');
}
