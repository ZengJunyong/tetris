/*
	Writed by 圣诞老人，QQ交流：277629199
 */
$(function() {
	var blockHeight = 30, // 方块的像素高度
		blockWidth = 30, // 方块的像素宽度
		mapWidth = 10, // map 的逻辑宽度
		mapHeight = 20, // map 的逻辑高度
		x = 0, // 方块的X方向位置，从 0 到 mapWidth - 1，到 mapWidth 实际上是边界上了
		y = 0, // 方块的Y方向位置，从 0 到 mapHeight - 1，到 mapHeight 实际上是边界上了
		score, // 得分
		top10 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //最高的前10个分数，按从大到小排列
		startTime, // 游戏的开始时间
		animateTime, // 方块下落的动画间隔时间，随着难度的增加，比如 score 的提高，该值会变小，也就是说速度会加快
		animate, // 是否动画
		map, // 二维数组，mapWidth行，mapHeight列，表示俄罗斯方块的地图，如果值为0表示该处还没有方块被填充，否则表示被7种方块中的一种填充了
		mapDiv, // 二维数组 map 所映射的 Dom Node 视图集合，即展现在 HTML 上面的标签集合，显然与 map 的行，列是相等的，主要用途是缓存
		blockType, // 方块的类型，总共有7种，值从0到6，方块的出现为随机生成
		turnState, // 方块的旋转状态下标，会逆时针和顺时针旋转，每次旋转90度，该值的大小与 blockType 有关，为 0 到 【0或1或3】 之间
		nextBlockType, // 用于玩家的预测方块
		nextTurnState,
		nextBlockDiv, // 用于预测的方块 Div ,长度是 4 的一维数组，因为每个方块都是由 4 个最基本的 Dom Node 组成的
		// 下标1到7代表方块的7种背景颜色；下标0为白色，用于画布的填充色；下标8为白色，用于作弊，显示一个笑脸的图形，所以不需要背景色
		blockColor = ['white', '#00D8D8', '#0000F0', '#F0A000', '#D8D800', '#00D800', '#9000D8', '#D80000', 'white'],
		shapes =
		/* 
		方块的7种形状，依次为：I,S,Z,J,O,L,T，每个形状都可以顺时针，逆时针90度变化。
		第一组数据为形状的二维数组，顺时针90度旋转，就变成了第二组数组。
		比如 O 形状，由于顺时针旋转90度，数组并不会发生变化，所以第二组数据没有，其它的形状类似，有的只需要2组数据表示即可。
		如果是逆时针90度呢？比如形状 T ，它的形状下标是 2 ，将 2 减去 1，即为逆时针 90 度后的形状数组，如果是 0 呢，减 1 是非法的，这时应该选取最后一个形状数组
		同理，顺时针 90 度的形状下标变化是加 1 ，如果数组越界，则选择第一个形状数组
		*/
		[
			[
				[
					[0, 0, 0, 0],
					[1, 1, 1, 1]
				],
				[
					[0, 1],
					[0, 1],
					[0, 1],
					[0, 1]
				]
			],
			[
				[
					[0, 2, 2],
					[2, 2, 0]
				],
				[
					[2, 0],
					[2, 2],
					[0, 2]
				]
			],
			[
				[
					[3, 3, 0],
					[0, 3, 3]
				],
				[
					[0, 3],
					[3, 3],
					[3, 0]
				]
			],
			[
				[
					[0, 4],
					[0, 4],
					[4, 4]
				],
				[
					[4, 0, 0],
					[4, 4, 4]
				],
				[
					[4, 4],
					[4, 0],
					[4, 0]
				],
				[
					[4, 4, 4],
					[0, 0, 4]
				]
			],
			[
				[
					[5, 5],
					[5, 5]
				]
			],
			[
				[
					[6, 0],
					[6, 0],
					[6, 6]
				],
				[
					[6, 6, 6],
					[6, 0, 0]
				],
				[
					[6, 6],
					[0, 6],
					[0, 6]
				],
				[
					[0, 0, 6],
					[6, 6, 6]
				]
			],
			[
				[
					[0, 7, 0],
					[7, 7, 7]
				],
				[
					[0, 7, 0],
					[0, 7, 7],
					[0, 7, 0]
				],
				[
					[7, 7, 7],
					[0, 7, 0]
				],
				[
					[0, 7],
					[7, 7],
					[0, 7]
				]
			]
		],
		metrisDiv = $('#metris'), // 俄罗斯方块的主面板，缓存
		timeDiv = $('#time'), //时间更新区域，缓存
		scoreDiv = $('#score'), // 分数更新区，缓存
		speedDiv = $('#speed'); //速度更新区，缓存

	/*
		生成新方块
	*/
	function newBlock() {
		blockType = nextBlockType;
		turnState = nextTurnState;
		x = mapWidth / 2 - 1; // 大约是放中间
		y = 0;
		score += 10; // 每生成一个方块加 10 分
		scoreDiv.text(score); // 更新分数
		if (!blow(x, y, blockType, turnState)) { // 生成的新方块摆放不合法，即判断游戏结束
			clearInterval(animate);
			for (var i = 0; i < 10; i++) {
				if (score > top10[i]) {
					top10[i] = score; //刷新最高分
					break;
				}
			}
			$('#top10').html('');
			for (i = 0; i < 10; i++) {
				$('#top10').append($('<li>' + top10[i] + '</li>'));
			}
			$('#top10 li:even').addClass('even');
			$('#myModal').modal();
		}
		paint();
		nextBlock(); // 生成下一个预测方块
	}

	/*
		生成下一个可预测的方块
	 */
	function nextBlock() {
		nextBlockType = Math.floor(Math.random() * 7); //0到6的随机数
		var turnStateLength = shapes[nextBlockType].length;
		nextTurnState = Math.floor(Math.random() * turnStateLength); //根据 blockType 类型的不同，随机选择一个形状
		// 画当前方块
		var shape = shapes[nextBlockType][nextTurnState];
		var height = shape.length;
		var width = shape[0].length;
		var i = 0;
		for (var a = 0; a < height; a++) {
			for (var b = 0; b < width; b++) {
				if (shape[a][b] !== 0) {
					nextBlockDiv[i++].css({
						left: b * blockWidth,
						top: a * blockHeight,
						backgroundColor: blockColor[shape[a][b]]
					});
				}
			}
		}
	}

	/*
		判断某个方块是否摆放合法，shapes 与 map 有重叠，则表明摆放不合法，返回 0
	*/
	function blow(x, y, blockType, turnState) {
		var shape = shapes[blockType][turnState]; // 某个形状，某个旋转状态的二维数组
		var height = shape.length;
		var width = shape[0].length; // 得到二维数组的宽与高
		if (x + width > mapWidth || x + width < 0 || y + height > mapHeight || y + height < 0) {
			return 0; //越界判断，摆放不合法
		}
		for (var a = 0; a < height; a++) {
			for (var b = 0; b < width; b++) {
				if (shape[a][b] !== 0 && map[y + a][x + b] !== 0) {
					return 0;
				}
			}
		}
		return 1;
	}

	/*
		消行
	*/
	function delLine() {
		var c = 0;
		var lines = 0;
		for (var a = 0; a < mapHeight; a++) {
			for (var b = 0; b < mapWidth; b++) {
				if (map[a][b] !== 0) {
					c++;
					if (c == mapWidth) { // 表明第 a 行全部不为 0 ，达到消行的条件
						lines++;
						for (var d = a; d > 0; d--) { // 第 a 行以上的数据全部往下移动一行
							for (var e = 0; e < mapWidth; e++) {
								map[d][e] = map[d - 1][e];
							}
						}
					}
				}
			}
			c = 0;
		}
		switch (lines) { // 行数消除越多，分数越高
			case 1:
				score += 100;
				break;
			case 2:
				score += 300;
				break;
			case 3:
				score += 600;
				break;
			case 4:
				score += 1000;
				break;
			default:
				break;
		}
		if (lines > 0) { // 更新分数
			scoreDiv.text(score);
			animateTime = -0.01 * score + 1000; // 随着 score 的增加，时间会越来越快
			if (animateTime < 100) { // 0.1 秒掉一格，应该很变态了，达到极限
				animateTime = 100;
			}
			speedDiv.text((animateTime / 1000 + '').substr(0, 5) + ' sec'); // 更新速度
			clearInterval(animate); // 停止动画
			animate = setInterval(action, animateTime); // 开始动画，让动画加速
		}
	}

	/*
		把当前的方块加入到 map 里面
	 */
	function addBlockToMap(x, y, blockType, turnState) {
		var shape = shapes[blockType][turnState];
		var height = shape.length;
		var width = shape[0].length;
		for (var a = 0; a < height; a++) {
			for (var b = 0; b < width; b++) {
				if (map[y + a][x + b] === 0) {
					map[y + a][x + b] = shape[a][b];
				}
			}
		}
	}

	/*
		绘制视图
	*/
	function paint() {
		var time = Math.floor((new Date() - startTime) / 1000); //转化为秒
		var hour = Math.floor(time / 3600);
		var minute = Math.floor(time % 3600 / 60);
		var second = Math.floor(time % 60);
		hour = hour >= 10 ? hour : '0' + hour;
		minute = minute >= 10 ? minute : '0' + minute;
		second = second >= 10 ? second : '0' + second;
		timeDiv.text(hour + ' : ' + minute + ' : ' + second); // 时间显示格式为： 00：00：00
		// 更新整个画布
		for (var i = 0; i < mapHeight; i++) {
			for (var j = 0; j < mapWidth; j++) {
				mapDiv[i][j].css({
					border: '1px solid #EDF7FC',
					backgroundColor: blockColor[map[i][j]]
				});
				if (map[i][j] != 8 && mapDiv[i][j].css('backgroundImage').length > 0) { // 如果值不等于8，且有 smile.gif 的背景图片，删除之
					mapDiv[i][j].css('backgroundImage', '');
				}
			}
		}
		// 更新当前方块
		var shape = shapes[blockType][turnState];
		var height = shape.length;
		var width = shape[0].length;
		for (var a = 0; a < height; a++) {
			for (var b = 0; b < width; b++) {
				if (shape[a][b] !== 0) {
					mapDiv[a + y][b + x].css({
						backgroundColor: blockColor[shape[a][b]],
						border: '1px solid gray'
					});
				}
			}
		}
	}

	function left() {
		if (blow(x - 1, y, blockType, turnState)) {
			x = x - 1;
		}
	}

	function right() {
		if (blow(x + 1, y, blockType, turnState)) {
			x = x + 1;
		}
	}

	function down() {
		var isBottom; //是否到底标志
		if (blow(x, y + 1, blockType, turnState)) { // 摆放合法
			y = y + 1;
			isBottom = 0;
		} else { // 摆放不合法
			addBlockToMap(x, y, blockType, turnState);
			newBlock();
			isBottom = 1;
			delLine();
		}
		return isBottom;
	}

	/*
		快速下落，直到底部
	 */
	function fastDown() {
		while (true) {
			if (down()) break;
		}
	}

	/*
		如果传入参数为 1 ，则顺时针旋转；传入参数为 0 ，则逆时针旋转
	 */
	function turn(clockwise) {
		var tempturnState = turnState;
		var turnStateLength = shapes[blockType].length;
		if (clockwise) {
			turnState = (turnState + 1) % turnStateLength;
		} else {
			turnState = (turnState - 1 + turnStateLength) % turnStateLength;
		}
		if (!blow(x, y, blockType, turnState)) {
			turnState = tempturnState;
		}
	}

	$('#stop').click(function() {
		if (animate) {
			clearInterval(animate);
			$('#stop').text('Start');
		} else {
			animate = setInterval(action, animateTime);
			$('#stop').text('Stop');
		}
		$('#stop').toggleClass('btn-primary');
	});

	/*
		开始游戏
	 */
	function beginGame() {
		startTime = new Date();
		score = 0;
		animateTime = 1000;
		init();
		nextBlock();
		newBlock();
		animate = setInterval(action, animateTime);
	}

	$('#newGame').click(function() {
		beginGame();
	});

	$(document).on('keypress', function(e) {
		var key = String.fromCharCode(e.keyCode);
		switch (key.toLowerCase()) {
			case 'w':
				fastDown();
				break;
			case 'a':
				left();
				break;
			case 's':
				down();
				break;
			case 'd':
				right();
				break;
			case 'j':
				turn(0);
				break;
			case 'k':
				turn(1);
				break;
		}
		paint();
	});

	/*
		初始化
	 */
	function init() {
		// div = 'metris' 的样式
		metrisDiv.css({
			height: blockHeight * mapHeight,
			width: blockWidth * mapWidth
		});
		// div = 'nextBlock' 的样式
		$('#nextBlock').css({
			height: blockHeight * 4,
			width: blockWidth * 4
		});
		//	初始化地图及视图：mapHeight 行，mapWidth列
		map = [];
		mapDiv = [];
		for (var j = 0; j < mapHeight; j++) {
			map[j] = [];
			mapDiv[j] = [];
		}
		metrisDiv.html(''); // 清空画布，因为 init 函数可以被多次调用
		for (var i = 0; i < mapHeight; i++) {
			for (j = 0; j < mapWidth; j++) {
				map[i][j] = 0;
				var div = $('<div/>').css({
					height: blockHeight - 2,
					width: blockWidth - 2,
					left: j * blockWidth,
					top: i * blockHeight,
					border: '1px solid #EDF7FC'
				});
				div[0].i = i;
				div[0].j = j;
				mapDiv[i][j] = div;
				metrisDiv.append(mapDiv[i][j]);
			}
		}
		// 加了个作弊的功能，可以点击每个块，将这个块补上去，如果下面有一两个小洞，使用该功能非常方便，不过在某种不可重现的场景下，似乎有bug，使用该功能后速度变得非常快！
		// http://www.kuqin.com/webpagedesign/20120317/318960.html jQuery代码优化：事件委托篇
		metrisDiv.on('click', 'div', function() {
			var i = this.i,
				j = this.j;
			if (map[i][j] === 0) {
				$(this).css({
					border: '1px solid green',
					background: 'url(img/smile.gif) center center no-repeat'
				});
				clearInterval(animate); // 停止动画
				setTimeout(function() {
					animate = setInterval(action, animateTime); // 隔一段时间再启动动画
					map[i][j] = 8; //赋给一个非 0 的值
					delLine();
					paint();
				}, 1000);
			}
		});
		$('#nextBlock').html('');
		nextBlockDiv = [];
		for (i = 0; i < 4; i++) {
			nextBlockDiv[i] = $('<div/>').css({
				height: blockHeight - 2,
				width: blockWidth - 2,
				border: '1px solid gray'
			});
			$('#nextBlock').append(nextBlockDiv[i]);
		}
		scoreDiv.text(score); // 更新分数
		speedDiv.text((animateTime / 1000 + '').substr(0, 5) + ' sec'); // 更新速度
	}

	function action() {
		paint();
		down();
	}

	beginGame();
});