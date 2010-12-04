var TwitterNode = require('twitter-node').TwitterNode

var twit = new TwitterNode({
    user: 'username',
    password: 'password',
});
twit
  // 捕捉するキーワード
  .track('music')
  // エラー時のコールバック
  .addListener('error', function(error){
    console.log(error.message)
  })
  // ツイート新着時のコールバック
  .addListener('tweet', function(tweet) {
    console.log('@' + tweet.user.screen_name + ': ' + tweet.text);
  })
  .stream();
