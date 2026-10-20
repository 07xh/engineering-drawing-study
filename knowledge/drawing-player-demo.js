/* Original demonstration data; NOT a textbook exercise or an answer. */
window.DrawingPlayerDemo={
 id:'original-player-smoke-test',title:'原创演示：点、直线与圆的逐步作图',type:'other',status:'steps-verified',
 source:{book:'图学课堂原创播放器功能测试',page:1},givens:[],renderMode:'manual-steps',
 steps:[
  {id:'point',explanation:'第一步：标出已知点 A。',actions:[{kind:'point',geometry:{x:140,y:190}},{kind:'text',geometry:{x:150,y:180},text:'A'}]},
  {id:'line',explanation:'第二步：从 A 向右画一条示意线段。',actions:[{kind:'line',geometry:{x1:140,y1:190,x2:450,y2:190}}]},
  {id:'circle',explanation:'第三步：绘制示意圆，观察此前的点和线段仍然保留。',actions:[{kind:'circle',geometry:{cx:450,cy:190,r:65}}]}
 ]
};
