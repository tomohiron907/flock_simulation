class Fish {
    constructor() {
        this.position = createVector(random(width), random(height));
        this.velocity = p5.Vector.random2D();
        this.acceleration = createVector();
        this.baseSpeed = 0.7;  // 基本速度
        this.currentSpeed = this.baseSpeed;  // 現在の速度
        this.maxForce = 0.1;
        this.size = 10;
        this.time = random(0, 1000); // 時間の初期値をランダムに設定
        this.maxSpeed = 5; // 最大速度を追加
    }

    // 群れの動きを制御する3つのルール
    align(fishes) {
        let perceptionRadius = 50;
        let steering = createVector();
        let total = 0;

        for (let other of fishes) {
            let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (other != this && d < perceptionRadius) {
                steering.add(other.velocity);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohesion(fishes) {
        let perceptionRadius = 100;
        let steering = createVector();
        let total = 0;

        for (let other of fishes) {
            let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (other != this && d < perceptionRadius) {
                steering.add(other.position);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    // 点が尾びれの領域内にあるかチェック
    isInFinArea(point) {
        // 魚の位置を原点とした相対座標に変換
        let relativePoint = p5.Vector.sub(point, this.position);
        // 魚の向きに合わせて回転
        let angle = -this.velocity.heading();
        let rotatedX = relativePoint.x * cos(angle) - relativePoint.y * sin(angle);
        let rotatedY = relativePoint.x * sin(angle) + relativePoint.y * cos(angle);
        
        // 尾びれの領域チェック (y > x² かつ y < 9)
        let scaledX = rotatedX / (this.size / 3);
        let scaledY = rotatedY / (this.size / 3);
        return scaledY > scaledX * scaledX && scaledY < 9;
    }

    separation(fishes) {
        let perceptionRadius = 45;
        let steering = createVector();
        let total = 0;

        for (let other of fishes) {
            let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (other != this && d < perceptionRadius) {
                let diff = p5.Vector.sub(this.position, other.position);
                
                // 尾びれの領域内にある場合は、より強い反発力を与える
                if (this.isInFinArea(other.position)) {
                    diff.mult(4.0);  // 反発力を2倍に
                }
                
                diff.div(d * d);
                steering.add(diff);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    avoidPredator() {
        let mousePos = createVector(mouseX, mouseY);
        let desired = p5.Vector.sub(this.position, mousePos);
        let d = desired.mag();
        
        // マウスとの距離が200ピクセル以内の場合のみ反応
        if (d < 200) {
            desired.normalize();
            desired.mult(this.maxSpeed);
            let steer = p5.Vector.sub(desired, this.velocity);
            steer.limit(this.maxForce * 2); // 通常の2倍の力で逃げる
            return steer;
        }
        return createVector(0, 0);
    }

    flock(fishes) {
        let alignment = this.align(fishes);
        let cohesion = this.cohesion(fishes);
        let separation = this.separation(fishes);
        let predatorAvoidance = this.avoidPredator();

        alignment.mult(0.5);
        cohesion.mult(0.5);
        separation.mult(0.8);
        predatorAvoidance.mult(1.5); // 捕食者からの逃避を優先

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
        this.acceleration.add(predatorAvoidance);
    }

    update() {
        // 尾鰭の係数に基づいて速度を調整
        let t = (this.time % 60) / 60;
        let coefficient = map(sin(t * TWO_PI), -1, 1, 0.2, 1);
        this.currentSpeed = this.baseSpeed * (0.7 + coefficient*1.3 );  // 係数が大きい時は速く、小さい時は遅く

        this.velocity.add(this.acceleration);
        this.velocity.setMag(this.currentSpeed);  // 現在の速度を適用
        this.position.add(this.velocity);
        this.acceleration.mult(0);

        // 画面端での折り返し
        if (this.position.x < 0) this.position.x = width;
        if (this.position.x > width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = height;
        if (this.position.y > height) this.position.y = 0;
    }

    show() {
        push();
        translate(this.position.x, this.position.y);
        rotate(this.velocity.heading());
        
        
        
        // 尾びれ（二次関数の曲線）
        stroke(80, 80, 80);
        strokeWeight(2);
        noFill();
        
        // 尾びれを-90度回転
        push();
        rotate(PI/2);  // -90度回転
        
        // 時間に基づいて係数を変化させる
        let t = (this.time % 60) / 60; // 1秒（60フレーム）で1周期
        let coefficient = map(sin(t * TWO_PI), -1, 1, 0.1, 1); // 0.1から1の範囲で振動
        
        // 二次関数の曲線を描画
        beginShape();
        let xRange = sqrt(9 / coefficient); // y=9になるxの範囲を計算
        for (let x = -xRange; x <= xRange; x += 0.1) {
            let y = coefficient * x * x;  // y = ax^2
            // スケーリングと位置調整
            let scaledX = x * (this.size / 3);
            let scaledY = y * (this.size / 3);
            vertex(scaledX, scaledY);
        }
        endShape();
        // 魚の本体（円）
        fill(255, 200, 200);
        noStroke();
        ellipse(0, 0, this.size, this.size);
        pop();
        
        pop();
        
        // 時間を更新（1フレームごとに1増加）
        this.time += 1;
    }
}

let fishes = [];
const numFishes = 100;

function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < numFishes; i++) {
        fishes.push(new Fish());
    }
}

function draw() {
    background(20, 20, 20);
    
    for (let fish of fishes) {
        fish.flock(fishes);
        fish.update();
        fish.show();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 