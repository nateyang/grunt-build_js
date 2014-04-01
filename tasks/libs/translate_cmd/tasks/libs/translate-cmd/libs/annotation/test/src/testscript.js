var name = 'test';//这里是一个单行注释
var description1 = '有时也会出现下面这种多行注释';
/*这种注释一般情况下
都是像这样跨
行的*/
var description2/*注释一*/ = '也有这种一行多个的'/*注释二*/;
var description3/*注释一*/ = '也有这种一行多个的'//注释二
var description4 = '/*但也有这种噁心的，你装成注释的模样，你家里人知道吗*/';
var description5 = '还有你//太猥琐了';
var description6 = "" + //还有这种//伪装成字符串的"";
var description7 = "" + /*接着装*/ + "";
var description8 = "js这种字符串换行真心很恶心\
                   //这里是字符串换行，并不是注释啊\
                   这里还是字符串/**/\
                   到这里字符串才算结束";
