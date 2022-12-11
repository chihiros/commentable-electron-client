let socket;
let sound;
let sound_chime;
let flg_chime;
let flg_clock;
let flg_noDraw;
let time_start;
let time_start_hour;
let time_start_minute;
let time_end;
let time_end_hour;
let time_end_minute;
let is_streaming = false;

let timestamp_last_send
let flg_deactivate_comment_control;
let peerConnection;

let color_text;
let color_text_stroke;
// TODO: 音量を調節できる様にした
let volume = 0.025;
// let volume = 0.1;

let mycanvas;
let max_number_of_comment = 100; // Maxの描画できるコメント数

const hostname = "https://commentable.fly.dev";
// const hostname = "http://localhost:8080";

let comments = []; //new Array(50);
function whileLoading(total) {
  console.log('loaded: ', + total);
}

function preload() {
  let count_loaded = 0;
  for (let i = 0; i < max_number_of_comment; i++) {
    comments[i] = new Comment();
    comments[i].setLife(0);
  }
  // Load sound files
  // TODO:この音声を読み込む処理で使っている、URI管理はフロント側で行いたい
  sound_chime = loadSound('./sounds/chime.mp3', readyLoading(++count_loaded), null, whileLoading);
  sound = [
    [loadSound('./sounds/camera1.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/camera2.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/camera3.mp3', readyLoading(++count_loaded))],
    [loadSound('./sounds/clap1.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap2.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap3.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap4.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap5.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap6.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap7.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/clap8.mp3', readyLoading(++count_loaded))],
    loadSound('./sounds/cracker.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/kansei.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/he.wav', readyLoading(++count_loaded)),
    loadSound('./sounds/chottomatte.wav', readyLoading(++count_loaded)),
    loadSound('./sounds/OK.wav', readyLoading(++count_loaded)),
    loadSound('./sounds/punch.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/laugh3.mp3', readyLoading(++count_loaded)),
    [loadSound('./sounds/kusa00.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/kusa01.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/kusa02.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/kusa03.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/kusa04.mp3', readyLoading(++count_loaded)),
    loadSound('./sounds/kusa05.mp3', readyLoading(++count_loaded))]
  ]
  sound_dodon = loadSound('./sounds/dodon.mp3', readyLoading(++count_loaded));
  sound_drumroll = loadSound('./sounds/drumroll.mp3', readyLoading(++count_loaded));
  sound_dora = loadSound('./sounds/dora.mp3', readyLoading(++count_loaded));
  sound_deden = loadSound('./sounds/quiz.mp3', readyLoading(++count_loaded));
  sound_pingpong = loadSound('./sounds/seikai.mp3', readyLoading(++count_loaded));
  sound_chin = loadSound('./sounds/chin.mp3', readyLoading(++count_loaded));
  sound_kansei = loadSound('./sounds/kansei.mp3', readyLoading(++count_loaded));
  sound_applause = loadSound('./sounds/applause.mp3', readyLoading(++count_loaded));
}

function startSocketConnection(room) {
  socket = io.connect(hostname);
  socket.on('you_are_connected', function () {
    // 部屋名を指定してジョインする．
    socket.emit('join', room);
  });

  socket.on('comment', newComment);
  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', (data) => {
    log(data.username + ' joined');
  });
  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(data.username + ' left');
  });
  socket.on('reconnect', () => {
    log('you have been reconnected');
    socket.emit('join', room);
  });
  socket.on('login', (data) => {
  });
  socket.on('deactivate_comment_control', (data) => {
  });

  socket.on("disconnectPeer", () => {
    peerConnection.close();
  });

  window.onunload = window.onbeforeunload = () => {
    socket.close();
  };
}

function setup() {
  textFont("Noto Sans JP");
  mycanvas = createCanvas(windowWidth, windowHeight);
  console.log(windowWidth, windowHeight);
  document.getElementById("canvas_placeholder").append(mycanvas.elt);

  frameRate(30); // フレームレートを30fpsに設定してあるみたい
  flg_deactivate_comment_control = false;
  let params = getURLParams();
  if (params.name) {

  }

  timestamp_last_send = millis();
  console.log(timestamp_last_send);
  textAlign(CENTER, CENTER);
  flg_sound_mute = false;
}

function draw() {
  clear();
  background(0, 0, 0, 0);

  for (let i = 0; i < max_number_of_comment; i++) {
    if (comments[i].getLife() > 0) {
      comments[i].update();
      comments[i].draw();
    }
  }
}

// newComment function でコメントを画面に描画する処理をしている
let count_comment = 0;
function newComment(data) {
  // 送られてきたコメントが空の場合は処理を終了する
  if (data.comment.length <= 0) {
    return;
  }

  // ライフがゼロになっている変数を探す（一番古い変数を探す）
  for (let i = 0; i < max_number_of_comment; i++) {
    if (comments[i].getLife() == 0) {
      id = i;
      i = max_number_of_comment;
    }
  }

  // 上書きできる変数が見つかった場合は、その変数を更新する
    comments[id].setLife(255);
    comments[id].setText(data.comment);
    textSize(abs((height / 20) * sin(0.5 * PI)));
    let text_width = textWidth(data.comment);
    console.log(textWidth(data.comment));
    if (text_width < width) {
      comments[id].setX(random(text_width / 2, width - text_width / 2));
    }
    else {
      comments[id].setX(text_width / 2);
    }
    comments[id].setY(random(100, height - 100));
    comments[id].setColor(data.color_text, data.color_text_stroke);
    comments[id].flg_image = data.flg_img;
    comments[id].id_image = data.id_img;
    comments[id].flg_sound = data.flg_sound;
    comments[id].id_sound = data.id_sound;

    if (data.flg_sound == true && flg_sound_mute == false) {
      comments[id].setVolume(volume);
      comments[id].playSound();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function toggleSoundMute() {
  flg_sound_mute = !flg_sound_mute;
}

function readyLoading(count_loaded) {
  console.log(count_loaded);
  document.getElementById('p5_loading').innerHTML = str(count_loaded) + ' files loaded.';
}

function toggleCommentControl(checked) {
  let data = {
    key: 'dummy',
    control: checked
  }
  socket.emit('deactivate_comment_control', data);
}
