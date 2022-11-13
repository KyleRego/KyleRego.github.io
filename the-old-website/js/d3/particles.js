(function() {
  const colors = ["#23171b","#271a28","#2b1c33","#2f1e3f","#32204a","#362354","#39255f","#3b2768",
                      "#3e2a72","#402c7b","#422f83","#44318b","#453493","#46369b","#4839a2","#493ca8",
                      "#493eaf","#4a41b5","#4a44bb","#4b46c0","#4b49c5","#4b4cca","#4b4ecf","#4b51d3",
                      "#4a54d7","#4a56db","#4959de","#495ce2","#485fe5","#4761e7","#4664ea","#4567ec",
                      "#446aee","#446df0","#426ff2","#4172f3","#4075f5","#3f78f6","#3e7af7","#3d7df7",
                      "#3c80f8","#3a83f9","#3985f9","#3888f9","#378bf9","#368df9","#3590f8","#3393f8",
                      "#3295f7","#3198f7","#309bf6","#2f9df5","#2ea0f4","#2da2f3","#2ca5f1","#2ba7f0",
                      "#2aaaef","#2aaced","#29afec","#28b1ea","#28b4e8","#27b6e6","#27b8e5","#26bbe3",
                      "#26bde1","#26bfdf","#25c1dc","#25c3da","#25c6d8","#25c8d6","#25cad3","#25ccd1",
                      "#25cecf","#26d0cc","#26d2ca","#26d4c8","#27d6c5","#27d8c3","#28d9c0","#29dbbe",
                      "#29ddbb","#2adfb8","#2be0b6","#2ce2b3","#2de3b1","#2ee5ae","#30e6ac","#31e8a9",
                      "#32e9a6","#34eba4","#35eca1","#37ed9f","#39ef9c","#3af09a","#3cf197","#3ef295",
                      "#40f392","#42f490","#44f58d","#46f68b","#48f788","#4af786","#4df884","#4ff981",
                      "#51fa7f","#54fa7d","#56fb7a","#59fb78","#5cfc76","#5efc74","#61fd71","#64fd6f",
                      "#66fd6d","#69fd6b","#6cfd69","#6ffe67","#72fe65","#75fe63","#78fe61","#7bfe5f",
                      "#7efd5d","#81fd5c","#84fd5a","#87fd58","#8afc56","#8dfc55","#90fb53","#93fb51",
                      "#96fa50","#99fa4e","#9cf94d","#9ff84b","#a2f84a","#a6f748","#a9f647","#acf546",
                      "#aff444","#b2f343","#b5f242","#b8f141","#bbf03f","#beef3e","#c1ed3d","#c3ec3c",
                      "#c6eb3b","#c9e93a","#cce839","#cfe738","#d1e537","#d4e336","#d7e235","#d9e034",
                      "#dcdf33","#dedd32","#e0db32","#e3d931","#e5d730","#e7d52f","#e9d42f","#ecd22e",
                      "#eed02d","#f0ce2c","#f1cb2c","#f3c92b","#f5c72b","#f7c52a","#f8c329","#fac029",
                      "#fbbe28","#fdbc28","#feb927","#ffb727","#ffb526","#ffb226","#ffb025","#ffad25",
                      "#ffab24","#ffa824","#ffa623","#ffa323","#ffa022","#ff9e22","#ff9b21","#ff9921",
                      "#ff9621","#ff9320","#ff9020","#ff8e1f","#ff8b1f","#ff881e","#ff851e","#ff831d",
                      "#ff801d","#ff7d1d","#ff7a1c","#ff781c","#ff751b","#ff721b","#ff6f1a","#fd6c1a",
                      "#fc6a19","#fa6719","#f96418","#f76118","#f65f18","#f45c17","#f25916","#f05716",
                      "#ee5415","#ec5115","#ea4f14","#e84c14","#e64913","#e44713","#e24412","#df4212",
                      "#dd3f11","#da3d10","#d83a10","#d5380f","#d3360f","#d0330e","#ce310d","#cb2f0d",
                      "#c92d0c","#c62a0b","#c3280b","#c1260a","#be2409","#bb2309","#b92108","#b61f07",
                      "#b41d07","#b11b06","#af1a05","#ac1805","#aa1704","#a81604","#a51403","#a31302",
                      "#a11202","#9f1101","#9d1000","#9b0f00","#9a0e00","#980e00","#960d00","#950c00",
                      "#940c00","#930c00","#920c00","#910b00","#910c00","#900c00","#900c00","#900c00"]
  const RADIUS_DECAY_FACTOR = 0.9;
  const MINIMUM_RADIUS_TO_BE_ALIVE = 0.5;
  const MAXIMUM_INITIAL_RADIUS = 15;
  const MINIMUM_INITIAL_RADIUS = 5;

  let particles = [];
  const svg = d3.select('#particles-container')
                .style('background-color', '#111')
                .on('mousemove', event => {
                  let mousePosition = d3.pointer(event);
                  particles.push(new Particle(mousePosition[0], mousePosition[1]));
                  svg.selectAll('circle')
                      .data(particles, d => d.id)
                      .enter()
                      .append('circle')
                      .attr('cx', d => d.x)
                      .attr('cy', d => d.y)
                      .attr('r', d => d.r)
                      .attr('fill', d => d.color);

                })
                .on('click', event => {
                  let mousePosition = d3.pointer(event);
                  for (let i = 0; i < 25; i += 1) {
                    particles.push(new Particle(mousePosition[0], mousePosition[1]));
                  }
                  svg.selectAll('circle')
                      .data(particles, d => d.id)
                      .enter()
                      .append('circle')
                      .attr('cx', d => d.x)
                      .attr('cy', d => d.y)
                      .attr('r', d => d.r)
                      .attr('fill', d => d.color);

                });
  let id = 0;
  class Particle {
    id;
    x;
    y;
    theta;
    vx;
    vy;
    r;
    color;
    isAlive;

    constructor(x, y) {
      this.id = id;
      id += 1;
      this.x = x;
      this.y = y;
      this.theta = this.randomRadians();
      this.vx = Math.sin(this.theta);
      this.vy = Math.cos(this.theta);
      this.r = this.randomRadius();
      this.color = this.randomColor();
      this.isAlive = true;
    }

    move() {
      this.x = this.x + this.vx;
      this.y = this.y + this.vy;
      this.theta = this.theta + this.randomDeltaTheta();
      this.vx = this.vx + Math.sin(this.theta);
      this.vy = this.vy + Math.cos(this.theta);
      this.r = this.r * RADIUS_DECAY_FACTOR;
      this.isAlive = this.r > MINIMUM_RADIUS_TO_BE_ALIVE;
    }

    randomRadians() {
      return Math.random() * Math.PI * 2;
    }

    randomRadius() {
      return Math.random() * (MAXIMUM_INITIAL_RADIUS - MINIMUM_INITIAL_RADIUS)
                           + MINIMUM_INITIAL_RADIUS;
    }

    randomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    randomDeltaTheta() {
      return Math.random() * (10 - (-10)) + (-10);
    }



  }

  d3.interval(() => {
    particles.forEach(particle => particle.move());
    particles = particles.filter(particle => particle.isAlive);

    svg.selectAll('circle')
        .data(particles, d => d.id)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.r)
        .attr('fill', d => d.color)
        .exit()
        .remove();
  }, 50);

})();