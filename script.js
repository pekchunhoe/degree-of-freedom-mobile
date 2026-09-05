/* =========================================================
   DEGREE OF FREEDOM (f) SIMULATION
   Molecular translation and rotation
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const state = {
  molecule: "monatomic",
  axis: "x",

  running: true,

  lastTime: performance.now(),

  translationPhase: 0,
  rotationAngle: 0,

  translationSpeed: 1.6,
  rotationSpeed: 1.4
};


/* =========================================================
   MOLECULE DATA
   ========================================================= */

const MOLECULES = {

  monatomic: {

    name: "Monatomic",

    trans: 3,
    rot: 0,

    examples: [
      "He — Helium",
      "Ne — Neon",
      "Ar — Argon"
    ],

    description:
      "A single atom can translate independently in x, y and z.",

    rotationDescription:
      "A monatomic particle has no rotational degrees of freedom in the basic model.",

    note: ""
  },


  diatomic: {

    name: "Diatomic",

    trans: 3,
    rot: 2,

    examples: [
      "H₂ — Hydrogen",
      "N₂ — Nitrogen",
      "O₂ — Oxygen"
    ],

    description:
      "A linear molecule translates in x, y and z and rotates about two axes perpendicular to its molecular axis.",

    rotationDescription:
      "A linear diatomic molecule has 2 rotational degrees of freedom.",

    note:
      "Rotation about the molecular axis is not counted in the basic rigid-rotor model."
  },


  polyatomic: {

    name: "Polyatomic",

    trans: 3,
    rot: 3,

    examples: [
      "H₂O — Water vapour",
      "CH₄ — Methane",
      "CO₂ — Carbon dioxide"
    ],

    description:
      "A non-linear polyatomic molecule translates in x, y and z and rotates about three perpendicular axes.",

    rotationDescription:
      "A non-linear polyatomic molecule has 3 rotational degrees of freedom.",

    note:
      "The shown f = 6 model applies to non-linear polyatomic molecules. CO₂ is linear, so it is an example of a polyatomic molecule but not of the shown rotational model."
  }
};


/* =========================================================
   AXIS DATA
   ========================================================= */

const AXES = {

  x: {
    label: "X axis",
    translation: "Translation along X",
    rotation: "Rotation about X"
  },

  y: {
    label: "Y axis",
    translation: "Translation along Y",
    rotation: "Rotation about Y"
  },

  z: {
    label: "Z axis",
    translation: "Translation along Z",
    rotation: "Rotation about Z"
  }
};


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const moleculeSelect =
  document.getElementById("moleculeSelect");

const axisSelect =
  document.getElementById("axisSelect");

const translationCanvas =
  document.getElementById("translationCanvas");

const rotationCanvas =
  document.getElementById("rotationCanvas");

const translationMode =
  document.getElementById("translationMode");

const rotationMode =
  document.getElementById("rotationMode");

const translationDescription =
  document.getElementById("translationDescription");

const rotationDescription =
  document.getElementById("rotationDescription");

const rotationExplanation =
  document.getElementById("rotationExplanation");

const rotationModeList =
  document.getElementById("rotationModeList");

const gasTypeLabel =
  document.getElementById("gasTypeLabel");

const gasExamples =
  document.getElementById("gasExamples");

const polyatomicNote =
  document.getElementById("polyatomicNote");

const currentTranslationAxis =
  document.getElementById("currentTranslationAxis");

const currentRotationAxis =
  document.getElementById("currentRotationAxis");

const translationalDOF =
  document.getElementById("translationalDOF");

const rotationalDOF =
  document.getElementById("rotationalDOF");

const totalDOF =
  document.getElementById("totalDOF");

const dofFormula =
  document.getElementById("dofFormula");

const moleculeDescription =
  document.getElementById("moleculeDescription");

const playPauseButton =
  document.getElementById("playPauseButton");

const resetButton =
  document.getElementById("resetButton");


/* =========================================================
   RESPONSIVE PARTICLE SIZE
   Smaller on phones.
   Normal size on tablets / iPad / laptop.
   ========================================================= */

function getParticleScale() {

  const width =
    window.innerWidth;


  /* Very small phone */

  if (width <= 380) {
    return 0.62;
  }


  /* Normal phone */

  if (width < 600) {
    return 0.72;
  }


  /* Large phone / small tablet */

  if (width < 768) {
    return 0.84;
  }


  /* Tablet / iPad / laptop */

  return 1.0;
}


/* =========================================================
   CANVAS HELPERS
   ========================================================= */

function resizeCanvas(canvas) {

  if (!canvas) return;


  const rect =
    canvas.getBoundingClientRect();


  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  const width =
    Math.max(
      1,
      Math.round(
        rect.width * dpr
      )
    );


  const height =
    Math.max(
      1,
      Math.round(
        rect.height * dpr
      )
    );


  if (
    canvas.width !== width ||
    canvas.height !== height
  ) {

    canvas.width =
      width;

    canvas.height =
      height;
  }
}


function prepareCanvas(canvas) {

  resizeCanvas(canvas);


  const ctx =
    canvas.getContext("2d");


  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  return {

    ctx,

    width:
      canvas.clientWidth,

    height:
      canvas.clientHeight
  };
}


/* =========================================================
   DRAW ARROW
   ========================================================= */

function drawArrow(
  ctx,
  x1,
  y1,
  x2,
  y2,
  label
) {

  const angle =
    Math.atan2(
      y2 - y1,
      x2 - x1
    );


  const size = 8;


  ctx.beginPath();

  ctx.moveTo(
    x1,
    y1
  );

  ctx.lineTo(
    x2,
    y2
  );

  ctx.stroke();


  ctx.beginPath();

  ctx.moveTo(
    x2,
    y2
  );


  ctx.lineTo(
    x2 -
      size *
      Math.cos(
        angle -
        Math.PI / 6
      ),

    y2 -
      size *
      Math.sin(
        angle -
        Math.PI / 6
      )
  );


  ctx.lineTo(
    x2 -
      size *
      Math.cos(
        angle +
        Math.PI / 6
      ),

    y2 -
      size *
      Math.sin(
        angle +
        Math.PI / 6
      )
  );


  ctx.closePath();

  ctx.fill();


  if (label) {

    ctx.fillText(
      label,

      (x1 + x2) / 2 + 5,

      (y1 + y2) / 2 - 5
    );
  }
}


/* =========================================================
   DRAW SELECTED AXIS
   ========================================================= */

function drawAxisLine(
  ctx,
  width,
  height,
  axis
) {

  const cx =
    width / 2;

  const cy =
    height / 2;


  ctx.save();


  ctx.lineWidth = 2;

  ctx.globalAlpha = 0.75;


  /* X */

  if (axis === "x") {

    drawArrow(
      ctx,

      25,
      cy,

      width - 25,
      cy,

      "X"
    );
  }


  /* Y */

  else if (axis === "y") {

    drawArrow(
      ctx,

      cx,
      height - 25,

      cx,
      25,

      "Y"
    );
  }


  /* Z */

  else {

    drawArrow(
      ctx,

      cx - 65,
      cy + 45,

      cx + 65,
      cy - 45,

      "Z"
    );
  }


  ctx.restore();
}


/* =========================================================
   MOLECULE GEOMETRY
   ========================================================= */

function getMoleculePoints(type) {


  /* -------------------------
     MONATOMIC
     ------------------------- */

  if (
    type === "monatomic"
  ) {

    return [

      {
        x: 0,
        y: 0,
        z: 0,
        r: 22
      }

    ];
  }


  /* -------------------------
     DIATOMIC
     ------------------------- */

  if (
    type === "diatomic"
  ) {

    return [

      {
        x: -34,
        y: 0,
        z: 0,
        r: 20
      },

      {
        x: 34,
        y: 0,
        z: 0,
        r: 20
      }

    ];
  }


  /* -------------------------
     NON-LINEAR POLYATOMIC
     ------------------------- */

  return [

    {
      x: -38,
      y: 20,
      z: 0,
      r: 17
    },

    {
      x: 0,
      y: -8,
      z: 0,
      r: 21
    },

    {
      x: 38,
      y: 20,
      z: 0,
      r: 17
    }

  ];
}


/* =========================================================
   3D ROTATION
   ========================================================= */

function rotatePoint(
  point,
  angle,
  axis
) {

  const c =
    Math.cos(angle);

  const s =
    Math.sin(angle);


  let x =
    point.x;

  let y =
    point.y;

  let z =
    point.z;


  /* -------------------------
     ROTATION ABOUT X
     ------------------------- */

  if (
    axis === "x"
  ) {

    const newY =
      y * c -
      z * s;


    const newZ =
      y * s +
      z * c;


    y =
      newY;

    z =
      newZ;
  }


  /* -------------------------
     ROTATION ABOUT Y
     ------------------------- */

  else if (
    axis === "y"
  ) {

    const newX =
      x * c +
      z * s;


    const newZ =
      -x * s +
      z * c;


    x =
      newX;

    z =
      newZ;
  }


  /* -------------------------
     ROTATION ABOUT Z
     ------------------------- */

  else {

    const newX =
      x * c -
      y * s;


    const newY =
      x * s +
      y * c;


    x =
      newX;

    y =
      newY;
  }


  return {

    x,
    y,
    z,

    r:
      point.r
  };
}


/* =========================================================
   3D → 2D PROJECTION
   ========================================================= */

function projectPoint(
  point,
  axis
) {

  const perspective =
    1 +
    point.z / 260;


  /* X-axis rotation
     Y-Z plane */

  if (
    axis === "x"
  ) {

    return {

      x:
        point.x,

      y:
        point.y *
        perspective,

      scale:
        perspective
    };
  }


  /* Y-axis rotation
     X-Z plane */

  if (
    axis === "y"
  ) {

    return {

      x:
        point.x *
        perspective,

      y:
        point.y,

      scale:
        perspective
    };
  }


  /* Z-axis rotation
     X-Y plane */

  return {

    x:
      point.x *
      perspective,

    y:
      point.y *
      perspective,

    scale:
      perspective
  };
}


/* =========================================================
   DRAW MOLECULE
   ========================================================= */

function drawMolecule(
  ctx,
  type,
  cx,
  cy,
  angle,
  axis
) {

  const points =
    getMoleculePoints(type);


  const particleScale =
    getParticleScale();


  const transformed =
    points.map(point => {

      const rotated =
        rotatePoint(
          point,
          angle,
          axis
        );


      const projected =
        projectPoint(
          rotated,
          axis
        );


      return {

        x:
          cx +
          projected.x,

        y:
          cy +
          projected.y,

        r:
          point.r *
          particleScale *
          Math.max(
            0.72,
            projected.scale
          ),

        z:
          rotated.z
      };
    });


  ctx.save();


  /* =======================================================
     MOLECULAR BONDS
     ======================================================= */

  if (
    type === "diatomic" ||
    type === "polyatomic"
  ) {

    ctx.lineWidth =
      8 *
      particleScale;

    ctx.lineCap =
      "round";


    ctx.beginPath();


    if (
      type === "diatomic"
    ) {

      ctx.moveTo(
        transformed[0].x,
        transformed[0].y
      );


      ctx.lineTo(
        transformed[1].x,
        transformed[1].y
      );
    }


    else {

      ctx.moveTo(
        transformed[0].x,
        transformed[0].y
      );


      ctx.lineTo(
        transformed[1].x,
        transformed[1].y
      );


      ctx.lineTo(
        transformed[2].x,
        transformed[2].y
      );
    }


    ctx.stroke();
  }


  /* =======================================================
     SORT BY DEPTH
     ======================================================= */

  const sorted =
    [...transformed].sort(
      (a, b) =>
        a.z - b.z
    );


  /* =======================================================
     DRAW ATOMS
     ======================================================= */

  sorted.forEach(
    (point, index) => {

      ctx.beginPath();


      ctx.arc(
        point.x,
        point.y,
        point.r,
        0,
        Math.PI * 2
      );


      ctx.fill();


      ctx.lineWidth =
        2;


      ctx.stroke();


      /* Atom labels */

      if (
        type === "diatomic"
      ) {

        ctx.fillText(
          index === 0
            ? "A"
            : "B",

          point.x - 4,
          point.y + 4
        );
      }


      else if (
        type === "polyatomic"
      ) {

        ctx.fillText(
          index === 1
            ? "C"
            : "A",

          point.x - 4,
          point.y + 4
        );
      }

    }
  );


  ctx.restore();
}


/* =========================================================
   TRANSLATION SIMULATION
   ========================================================= */

function drawTranslation() {

  const {
    ctx,
    width,
    height
  } =
    prepareCanvas(
      translationCanvas
    );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const cx =
    width / 2;

  const cy =
    height / 2;


  ctx.save();


  ctx.font =
    "600 14px sans-serif";


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.lineWidth =
    1.5;


  const amplitude =
    Math.min(
      width,
      height
    ) * 0.27;


  const displacement =
    Math.sin(
      state.translationPhase
    ) *
    amplitude;


  /* Draw selected axis */

  drawAxisLine(
    ctx,
    width,
    height,
    state.axis
  );


  /* =======================================================
     X TRANSLATION
     ======================================================= */

  if (
    state.axis === "x"
  ) {

    drawMolecule(

      ctx,

      state.molecule,

      cx +
        displacement,

      cy,

      0,

      "z"
    );
  }


  /* =======================================================
     Y TRANSLATION
     ======================================================= */

  else if (
    state.axis === "y"
  ) {

    drawMolecule(

      ctx,

      state.molecule,

      cx,

      cy +
        displacement,

      0,

      "z"
    );
  }


  /* =======================================================
     Z TRANSLATION
     Pseudo-3D representation
     ======================================================= */

  else {

    const scale =
      1 +
      0.25 *
      Math.sin(
        state.translationPhase
      );


    ctx.save();


    ctx.translate(

      cx +
        displacement *
        0.35,

      cy -
        displacement *
        0.20
    );


    ctx.scale(
      scale,
      scale
    );


    drawMolecule(

      ctx,

      state.molecule,

      0,
      0,

      0,

      "z"
    );


    ctx.restore();
  }


  ctx.restore();
}


/* =========================================================
   ROTATION INDICATOR
   ========================================================= */

function drawRotationIndicator(
  ctx,
  cx,
  cy,
  radius,
  axis
) {

  ctx.save();


  ctx.lineWidth =
    2;


  /* =======================================================
     X AXIS
     Rotation plane = Y-Z
     ======================================================= */

  if (
    axis === "x"
  ) {

    ctx.beginPath();


    ctx.ellipse(

      cx,
      cy,

      radius * 0.42,
      radius,

      0,

      0,
      Math.PI * 2
    );


    ctx.stroke();
  }


  /* =======================================================
     Y AXIS
     Rotation plane = X-Z
     ======================================================= */

  else if (
    axis === "y"
  ) {

    ctx.beginPath();


    ctx.ellipse(

      cx,
      cy,

      radius,
      radius * 0.42,

      0,

      0,
      Math.PI * 2
    );


    ctx.stroke();
  }


  /* =======================================================
     Z AXIS
     Rotation plane = X-Y
     ======================================================= */

  else {

    ctx.beginPath();


    ctx.arc(

      cx,
      cy,

      radius * 0.72,

      0,
      Math.PI * 2
    );


    ctx.stroke();
  }


  /* =======================================================
     ANIMATED ARROW
     ======================================================= */

  const angle =
    state.rotationAngle;


  let ex;
  let ey;

  let tangentX;
  let tangentY;


  /* X */

  if (
    axis === "x"
  ) {

    ex =
      cx;

    ey =
      cy -
      radius;


    tangentX =
      radius * 0.42;

    tangentY =
      0;
  }


  /* Y */

  else if (
    axis === "y"
  ) {

    ex =
      cx +
      radius;

    ey =
      cy;


    tangentX =
      0;

    tangentY =
      radius * 0.42;
  }


  /* Z */

  else {

    const r =
      radius * 0.72;


    ex =
      cx +
      r *
      Math.cos(angle);


    ey =
      cy +
      r *
      Math.sin(angle);


    tangentX =
      -r *
      Math.sin(angle);


    tangentY =
      r *
      Math.cos(angle);
  }


  const tangentAngle =
    Math.atan2(
      tangentY,
      tangentX
    );


  const arrowSize =
    9;


  ctx.beginPath();


  ctx.moveTo(
    ex,
    ey
  );


  ctx.lineTo(

    ex -
      arrowSize *
      Math.cos(
        tangentAngle -
        Math.PI / 6
      ),

    ey -
      arrowSize *
      Math.sin(
        tangentAngle -
        Math.PI / 6
      )
  );


  ctx.lineTo(

    ex -
      arrowSize *
      Math.cos(
        tangentAngle +
        Math.PI / 6
      ),

    ey -
      arrowSize *
      Math.sin(
        tangentAngle +
        Math.PI / 6
      )
  );


  ctx.closePath();


  ctx.fill();


  /* Axis description */

  ctx.font =
    "700 13px sans-serif";


  ctx.textAlign =
    "center";


  ctx.fillText(

    `Rotation about ${axis.toUpperCase()} axis`,

    cx,

    cy +
      radius +
      24
  );


  ctx.restore();
}


/* =========================================================
   ROTATION SIMULATION
   ========================================================= */

function drawRotation() {

  const {
    ctx,
    width,
    height
  } =
    prepareCanvas(
      rotationCanvas
    );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const cx =
    width / 2;

  const cy =
    height / 2;


  ctx.save();


  ctx.font =
    "600 14px sans-serif";


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  /* =======================================================
     MONATOMIC
     ======================================================= */

  if (
    state.molecule ===
    "monatomic"
  ) {

    ctx.fillText(

      "No rotational DOF",

      cx,

      cy - 10
    );


    ctx.font =
      "13px sans-serif";


    ctx.fillText(

      "Monatomic particle",

      cx,

      cy + 18
    );


    ctx.restore();

    return;
  }


  /* =======================================================
     SELECTED ROTATION AXIS
     ======================================================= */

  drawAxisLine(

    ctx,

    width,

    height,

    state.axis
  );


  /* =======================================================
     ROTATING MOLECULE
     ======================================================= */

  drawMolecule(

    ctx,

    state.molecule,

    cx,

    cy,

    state.rotationAngle,

    state.axis
  );


  /* =======================================================
     ROTATION CURVE
     ======================================================= */

  drawRotationIndicator(

    ctx,

    cx,

    cy,

    Math.min(
      width,
      height
    ) * 0.27,

    state.axis
  );


  /* =======================================================
     AXIS LABEL
     ======================================================= */

  ctx.font =
    "700 14px sans-serif";


  ctx.fillText(

    `R${state.axis.toUpperCase()}`,

    cx,

    cy -
      Math.min(
        width,
        height
      ) * 0.38
  );


  ctx.restore();
}


/* =========================================================
   GAS EXAMPLES
   ========================================================= */

function updateGasExamples() {

  const data =
    MOLECULES[
      state.molecule
    ];


  gasTypeLabel.textContent =
    `${data.name} gas examples`;


  gasExamples.innerHTML =
    "";


  data.examples.forEach(
    example => {

      const item =
        document.createElement(
          "div"
        );


      item.textContent =
        example;


      gasExamples.appendChild(
        item
      );
    }
  );


  if (data.note) {

    polyatomicNote.textContent =
      data.note;


    polyatomicNote.style.display =
      "block";
  }


  else {

    polyatomicNote.textContent =
      "";


    polyatomicNote.style.display =
      "none";
  }
}


/* =========================================================
   ROTATIONAL MODES
   ========================================================= */

function updateRotationModes() {

  /* =======================================================
     MONATOMIC
     ======================================================= */

  if (
    state.molecule ===
    "monatomic"
  ) {

    rotationMode.textContent =
      "No rotational motion";


    rotationExplanation.textContent =
      "A monatomic particle has 0 rotational degrees of freedom in the basic model.";


    rotationModeList.innerHTML =
      "<div>No rotational DOF</div>";


    return;
  }


  rotationMode.textContent =
    AXES[
      state.axis
    ].rotation;


  /* =======================================================
     DIATOMIC
     ======================================================= */

  if (
    state.molecule ===
    "diatomic"
  ) {

    rotationExplanation.textContent =
      "A linear diatomic molecule has 2 rotational DOF about axes perpendicular to its molecular axis.";


    rotationModeList.innerHTML = `

      <div>
        Rₓ — rotation about X
      </div>

      <div>
        Rᵧ — rotation about Y
      </div>

      <div>
        2 perpendicular rotational modes
      </div>

    `;
  }


  /* =======================================================
     POLYATOMIC
     ======================================================= */

  else {

    rotationExplanation.textContent =
      "A non-linear polyatomic molecule has 3 independent rotational DOF.";


    rotationModeList.innerHTML = `

      <div>
        Rₓ — rotation about X
      </div>

      <div>
        Rᵧ — rotation about Y
      </div>

      <div>
        R𝓏 — rotation about Z
      </div>

    `;
  }
}


/* =========================================================
   PHYSICS VALUES
   ========================================================= */

function updatePhysicsValues() {

  const data =
    MOLECULES[
      state.molecule
    ];


  translationalDOF.textContent =
    data.trans;


  rotationalDOF.textContent =
    data.rot;


  totalDOF.textContent =
    data.trans +
    data.rot;


  dofFormula.textContent =
    `f = ${data.trans} + ${data.rot} = ${data.trans + data.rot}`;
}


/* =========================================================
   AXIS INFORMATION
   ========================================================= */

function updateAxisInfo() {

  currentTranslationAxis.textContent =
    AXES[
      state.axis
    ].label;


  currentRotationAxis.textContent =
    AXES[
      state.axis
    ].label;


  translationMode.textContent =
    AXES[
      state.axis
    ].translation;


  if (
    state.molecule !==
    "monatomic"
  ) {

    rotationMode.textContent =
      AXES[
        state.axis
      ].rotation;
  }


  translationDescription.textContent =
    `The molecule moves along the selected ${state.axis.toUpperCase()} axis without rotating.`;


  rotationDescription.textContent =
    MOLECULES[
      state.molecule
    ].rotationDescription;
}


/* =========================================================
   MOLECULE DESCRIPTION
   ========================================================= */

function updateMoleculeDescription() {

  const data =
    MOLECULES[
      state.molecule
    ];


  moleculeDescription.textContent =
    data.description;
}


/* =========================================================
   PLAY / PAUSE BUTTON
   ========================================================= */

function updatePlayPauseButton() {

  playPauseButton.textContent =
    state.running
      ? "Pause"
      : "Play";
}


/* =========================================================
   UPDATE ALL UI
   ========================================================= */

function updateUI() {

  updateGasExamples();

  updateRotationModes();

  updatePhysicsValues();

  updateAxisInfo();

  updateMoleculeDescription();

  updatePlayPauseButton();
}


/* =========================================================
   RESET
   ========================================================= */

function resetSimulation() {

  state.translationPhase =
    0;


  state.rotationAngle =
    0;


  state.lastTime =
    performance.now();


  drawTranslation();

  drawRotation();
}


/* =========================================================
   MOLECULE SELECT
   ========================================================= */

moleculeSelect.addEventListener(
  "change",
  () => {

    state.molecule =
      moleculeSelect.value;


    state.rotationAngle =
      0;


    updateUI();

    resetSimulation();
  }
);


/* =========================================================
   AXIS SELECT
   ========================================================= */

axisSelect.addEventListener(
  "change",
  () => {

    state.axis =
      axisSelect.value;


    state.rotationAngle =
      0;


    updateUI();

    resetSimulation();
  }
);


/* =========================================================
   PLAY / PAUSE
   ========================================================= */

playPauseButton.addEventListener(
  "click",
  () => {

    state.running =
      !state.running;


    state.lastTime =
      performance.now();


    updatePlayPauseButton();
  }
);


/* =========================================================
   RESET BUTTON
   ========================================================= */

resetButton.addEventListener(
  "click",
  () => {

    resetSimulation();
  }
);


/* =========================================================
   TOUCH-FRIENDLY CANVAS
   ========================================================= */

[
  translationCanvas,
  rotationCanvas
].forEach(
  canvas => {

    if (!canvas) return;


    canvas.addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();
      }
    );


    canvas.addEventListener(
      "touchstart",
      event => {

        event.preventDefault();

      },
      {
        passive: false
      }
    );
  }
);


/* =========================================================
   RESIZE
   ========================================================= */

function handleResize() {

  resizeCanvas(
    translationCanvas
  );


  resizeCanvas(
    rotationCanvas
  );


  drawTranslation();

  drawRotation();
}


window.addEventListener(
  "resize",
  handleResize
);


window.addEventListener(
  "orientationchange",
  () => {

    setTimeout(
      handleResize,
      150
    );
  }
);


/* =========================================================
   MAIN ANIMATION LOOP
   ========================================================= */

function animate(now) {

  const dt =
    Math.min(

      (now -
        state.lastTime) /
        1000,

      0.05
    );


  state.lastTime =
    now;


  if (state.running) {

    state.translationPhase +=
      dt *
      state.translationSpeed;


    state.rotationAngle +=
      dt *
      state.rotationSpeed;
  }


  drawTranslation();

  drawRotation();


  requestAnimationFrame(
    animate
  );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

updateUI();

handleResize();

requestAnimationFrame(
  animate
);
