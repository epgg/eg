const VR_TRACK_WIDTH = 100;
const VR_TRACK_HEIGHT = 2;

function getCurrentDisplayedRegionModel() {
    const browserStartRegion = new RegionWrapper(browser.regionLst[0]);
    const browserEndRegion = new RegionWrapper(browser.regionLst[browser.regionLst.length - 1]);

    const absStart = hg19Context.convertFeatureCoordinateToBase(
        browserStartRegion.chr, browserStartRegion.start
    );
    const absEnd = hg19Context.convertFeatureCoordinateToBase(
        browserEndRegion.chr, browserEndRegion.end
    );
    return new DisplayedRegionModel(hg19Context, absStart, absEnd);
}

var vr_oldRegion = null;
function renderVrScene(text) {
    let viewModel = getCurrentDisplayedRegionModel();
    if (vr_oldRegion && vr_oldRegion.getAbsoluteRegion().start === viewModel.getAbsoluteRegion().start) {
        viewModel = vr_oldRegion;
    }
    vr_oldRegion = viewModel;

    // Make tracks
    const tracks = [];
    for (let i = browser.tklst.length - 1; i >= 0; i--) {
        const track = browser.tklst[i];
        if (isNumerical(track)) {
            tracks.push(React.createElement(VrTrack, {key: i, trackObject: track,}));
        }
    }

    const scene = React.createElement(BrowserScene, {
        viewRegion: viewModel,
        tracks: tracks,
        trackWidth: VR_TRACK_WIDTH,
        embedded: true,
        style: {
            width: 600,
            height: 300,
        }
    },
        React.createElement(VrCamera, {text: text})
    );

    let vrDiv = document.getElementById('vr');
    if (!vrDiv) {
        vrDiv = document.createElement('div');
        vrDiv.setAttribute('id', 'vr');
        document.body.appendChild(vrDiv);
    }
    ReactDOM.render(scene, vrDiv);
}

class VrTrack extends React.PureComponent {
    /*
    static propTypes = {
        trackObject: PropTypes.object.isRequired,
        width: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
        id: PropTypes.string
    };
    */

    makeLighterColor(stringColor, howMuchLighter=25) {
        let div = document.createElement('div');
        div.style.color = stringColor;
        const colors = div.style.color.match(/\d+/g);
        const rgb = colors.map(
            channel => Math.min(Number.parseInt(channel, 10) + howMuchLighter, 255)
        );
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    makeObject3D() { // http://blog.sandromartis.com/2016/11/16/merging-geometries/
        let {trackObject, width, z} = this.props;

        const MATERIAL = new THREE.MeshBasicMaterial({color: trackObject.qtc.pth});
        const WIREFRAME_MATERIAL = new THREE.MeshBasicMaterial({
            color: this.makeLighterColor(trackObject.qtc.pth, 50),
            wireframe: true
        });
        const data = trackObject.data[0];
        const boxWidth = width / data.length;
        const dataMax = data.reduce(((prevMax, currentValue) => currentValue > prevMax ? currentValue : prevMax), -Infinity);

        let geometries = [];
        for (let i = 0; i < data.length; i++) {
            const height = (data[i] / dataMax) * VR_TRACK_HEIGHT;
            if (!Number.isFinite(height) || height < 0.1) {
                continue;
            }
            const x = i * boxWidth;
            const y = height/2;

            let boxGeometry = new THREE.BoxBufferGeometry(boxWidth, height, 0.05);
            boxGeometry.translate(x, y, z);
            geometries.push(boxGeometry);
        }
        const mergedGeometry = mergeGeometries(geometries);

        const boxes = new THREE.Mesh(mergedGeometry, MATERIAL);
        const wireframe = new THREE.Mesh(mergedGeometry, WIREFRAME_MATERIAL);
        let group = new THREE.Group();
        group.add(boxes);
        group.add(wireframe);
        return group;
    }

    render() {
        return React.createElement(Custom3DObject, {
            object3D: this.makeObject3D(),
            position: `${-this.props.width/2} 0 -0.2`,
            class: "vr-track",
            ref: (element) => {
                if (element && element.entityRef) {
                    element.entityRef.trackObj = this.props.trackObject;
                }
            }
        });
    }
}

function vrSceneMousePressed(event) {
    const detail = event.nativeEvent.detail
    if (detail.intersection && detail.intersectedEl.trackObj) {
        const trackObj = detail.intersectedEl.trackObj;
        const drawModel = new LinearDrawingModel(vr_oldRegion, VR_TRACK_WIDTH);
        const point = detail.intersection.point;
        const base = drawModel.xToBase(point.x + VR_TRACK_WIDTH / 2);
        const coords = vr_oldRegion.getNavigationContext().convertBaseToFeatureCoordinate(base);

        const dataMax = trackObj.data[0].reduce(((prevMax, currentValue) => currentValue > prevMax ? currentValue : prevMax), -Infinity);
        const value = point.y / VR_TRACK_HEIGHT * dataMax;
        renderVrScene(`${trackObj.label}\n${coords.getName()}:${Math.round(coords.relativeStart)}\n${value}`);
        console.log(drawModel);
    } else {
        renderVrScene();
    }
}

function VrCamera(props) {
    let entityProps = {
        id: "vrCamera",
        camera: "",
        cursor: "rayOrigin: mouse",
        raycaster: "objects: .vr-track",
        position: "0 1.6 0",
        onMouseDown: vrSceneMousePressed,
    };
    entityProps["look-controls"] = "";
    entityProps["wasd-controls"] = "fly: true";

    const textBox = props.text ? React.createElement(HudTextBox, {text: props.text}) : null;

    return React.createElement('a-entity', entityProps, textBox);
}

function HudTextBox(props) {
    console.log("rendering with", props.text);
    return React.createElement('a-entity', {
        geometry: "primitive: plane; width: 0.25; height: auto",
        material: "color: black; transparent: true; opacity: 0.5",
        position: "0.2 0.15 -0.25",
        text: `value: ${props.text}`
    });
}
