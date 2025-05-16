class Fish {
    constructor() {
        this.position = createVector(random(width), random(height));
        this.velocity = p5.Vector.random2D();
        this.acceleration = createVector();
        this.maxSpeed = 2;
        this.maxForce = 0.1;
        this.size = 10;
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

    separation(fishes) {
        let perceptionRadius = 35;
        let steering = createVector();
        let total = 0;

        for (let other of fishes) {
            let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (other != this && d < perceptionRadius) {
                let diff = p5.Vector.sub(this.position, other.position);
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

    flock(fishes) {
        let alignment = this.align(fishes);
        let cohesion = this.cohesion(fishes);
        let separation = this.separation(fishes);

        alignment.mult(0.5);
        cohesion.mult(0.5);
        separation.mult(0.8);

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
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
        
        // 魚の本体（円）
        fill(255, 200, 200);
        noStroke();
        ellipse(0, 0, this.size, this.size);
        
        // 尾びれ（二次関数の曲線）
        stroke(255, 150, 150);
        strokeWeight(2);
        noFill();
        
        // 尾びれを-90度回転
        push();
        rotate(PI/2);  // -90度回転
        
        // 二次関数の曲線を描画
        beginShape();
        for (let x = -3; x <= 3; x += 0.1) {
            let y = x * x;  // y = x^2
            // スケーリングと位置調整
            let scaledX = x * (this.size / 3);
            let scaledY = y * (this.size / 3);
            vertex(scaledX, scaledY);
        }
        endShape();
        
        pop();
        
        pop();
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