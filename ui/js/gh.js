var xhrPool = [];
var msgLoading = '<div class="alert alert-info alert-block"><h1><span class="mega-octicon octicon-hourglass"></span>&nbsp;loading</h1><p>accessing the github api...</p></div>';
var msgSuccess = '<div class="alert alert-success alert-block"><h1><span class="mega-octicon octicon-issue-opened"></span>&nbsp;success!</h1><p>loaded data from the github api.</p></div>';
var msgError = '<div class="alert alert-error alert-block"><h1><span class="mega-octicon octicon-issue-opened"></span>&nbsp;error!</h1><p>failed to load data from the github api.</p></div>';
function init() {
	overview();
	$('#navActivity').click(function(){
		abortAjax();
		activity();
	});
	$('#navRepos').click(function(){
		abortAjax();
		repos();
	});
	$('#navOrgs').click(function(){
		abortAjax();
		orgs();
	});
	$('#navGists').click(function(){
		abortAjax();
		gists();
	});
	$('#navWatch').click(function(){
		abortAjax();
		following();
	});
	$('#navFollow').click(function(){
		abortAjax();
		followers();
	});
}
function overview() {
	api(
		'GET',
		'https://api.github.com/users/xero',
		'',
		function(result){
			$('#repoCount').html('&nbsp;'+ result.public_repos);
			$('#gistCount').html('&nbsp;'+result.public_gists);
			$('#watchCount').html('&nbsp;'+result.following);
			$('#followCount').html('&nbsp;'+result.followers);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
	api(
		'GET',
		'https://api.github.com/users/xero/orgs',
		'',
		function(result){
			$('#orgCount').html('&nbsp;'+result.length);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function activity() {
	$('#title').html('<h1>activity</h1>');
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/events',
		'',
		function(result){
			var x = '<div class="container-fluid">';
			$.each(result, function(i){
				var user = '<a href="http://github.com/'+result[i].actor.login+'">'+result[i].actor.login+'</a>';
				var repo = '<a href="http://github.com/'+result[i].repo.name+'">'+result[i].repo.name+'</a>';
				var date = timeAgo(new Date(result[i].created_at).getTime() / 1000);
				var icon = 'mega-icon-help';
				var msg = '<br/>';
				switch(result[i].type) {
					case 'CommitCommentEvent':
						icon = 'mega-icon-discussion';
						var body = result[i].payload.issue.body.length > 50 ? result[i].payload.issue.body.substring(0, 49)+'...' : result[i].payload.issue.body;
						msg = '&nbsp;commented on commit: '+repo+' / <a href="'+result[i].payload.issue.html_url+'">'+result[i].payload.issue.title+'</a><br/><blockquote>'+body+'</blockquote>';
					break;
					case 'CreateEvent':
						var type = result[i].payload.ref_type;
						switch(type) {
							case 'branch':
								icon = 'mini-icon-branch';
								msg = '&nbsp;created&nbsp;'+type+'&nbsp;<span class="well"><span class="mini-icon mini-icon-branch"></span>&nbsp;'+result[i].payload.ref+'&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>';
							break;
							case 'tag':
								icon = 'mini-icon-tag-create';
								msg = '&nbsp;created&nbsp;'+type+'&nbsp;<span class="well"><span class="mini-icon mini-icon-tag-create"></span>&nbsp;'+result[i].payload.ref+'&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>';
							break;
							case 'repository':
							default:
								icon = 'mini-icon-create';
								msg = '&nbsp;created&nbsp;'+type+'&nbsp;<span class="well"><span class="mini-icon mini-icon-create"></span>&nbsp;'+repo+'&nbsp;</span><br/>';
							break;
						}
					break;
					case 'DeleteEvent':
						var ref = result[i].payload.ref;
						var type = result[i].payload.ref_type;
						switch(type) {
							case 'branch':
								icon = 'mega-icon-branch-delete';
								var mini = 'mini-icon-branch-delete';
							break;
							case 'repo':
								icon = 'mega-icon-delete';
								var mini = 'mini-icon-delete';
							break;
							case 'tag':
								icon = 'mega-icon-tag-delete';
								var mini = 'mini-icon-tag-delete';
							break;
						}
						msg = '&nbsp;deleted&nbsp;'+type+'&nbsp;<span class="well"><span class="mini-icon '+mini+'"></span>&nbsp;'+ref+'&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>';
					break;
					case 'DownloadEvent':
						icon = 'mega-icon-download';
					break;
					case 'FollowEvent':
						icon = 'mega-icon-follow';
						msg = '&nbsp;started following&nbsp;<a href="'+result[i].payload.target.html_url+'">'+result[i].payload.target.login+'</a><br/>';
					break;
					case 'ForkEvent':
						icon = 'mini-icon-repo-forked';
						msg = '&nbsp;forked&nbsp;'+repo+'&nbsp;into&nbsp;<span class="well"><span class="mini-icon mini-icon-fork"></span>&nbsp;<a href="http://github.com/'+result[i].payload.forkee.full_name+'">'+result[i].payload.forkee.full_name+'</a>&nbsp;</span><br/>';
					break;
					case 'ForkApplyEvent':
						icon = 'mega-icon-fork';
					break;
					case 'GistEvent':
						icon = 'mega-icon-gist';
					break;
					case 'GollumEvent':
						icon = 'mega-icon-text-file';
						msg = '&nbsp;created the <a href="'+result[i].payload.pages.html_url+'">'+result[i].payload.pages[0].title+'</a> page in the '+repo+' wiki.<br/>';
					break;
					case 'IssueCommentEvent':
						var body = result[i].payload.issue.body.length > 250 ? result[i].payload.comment.body.substring(0, 249)+'...' : result[i].payload.comment.body;
						msg = '&nbsp;commented on issue: '+repo+' / <a href="'+result[i].payload.issue.html_url+'">'+result[i].payload.issue.title+'</a><br/><blockquote>'+body+'</blockquote>';
						icon = 'mega-icon-issue-comment';
					break;
					case 'IssuesEvent':
						var action = result[i].payload.action;
						var body = result[i].payload.issue.body.length > 250 ? result[i].payload.issue.body.substring(0, 249)+'...' : result[i].payload.issue.body;
						msg = '&nbsp;'+action+'&nbsp;issue&nbsp;'+repo+'&nbsp;/&nbsp;<a href="'+result[i].payload.issue.html_url+'">'+result[i].payload.issue.title+'</a><blockquote>'+body+'</blockquote>';
						switch(action) {
							case 'reopened':
								icon = 'mega-icon-issue-reopened';
							break;
							case 'closed':
								icon = 'mega-icon-issue-closed';
							break;
							case 'opened':
							default:
								icon = 'mega-icon-issue-opened';
							break;
						}
					break;
					case 'MemberEvent':
						icon = 'mega-icon-person';
						msg = '&nbsp;'+result[i].payload.action+'&nbsp;member&nbsp;<a href="http://github.com/'+result[i].payload.member.login+'">'+result[i].payload.member.login+'</a>&nbsp;to&nbsp;'+repo+'<br/>';
					break;
					case 'PublicEvent':
						icon = 'mega-icon-megaphone';
					break;
					case 'PullRequestEvent':
						icon = 'mega-icon-pull-request';
						msg = '&nbsp;'+result[i].payload.action+'&nbsp; a pull request:&nbsp;<a href="'+result[i].payload.pull_request.html_url+'">'+result[i].repo.name+'/#'+result[i].payload.number+'</a><br/><blockquote><a href="'+result[i].payload.pull_request.head.repo.html_url+'/commit/'+result[i].payload.pull_request.head.sha+'">'+result[i].payload.pull_request.head.sha.substring(0, 7)+'</a>&nbsp;'+result[i].payload.pull_request.title+'</blockquote>';
					break;
					case 'PullRequestReviewCommentEvent':
						icon = 'mega-icon-commit-comment';
					break;
					case 'PushEvent':
						icon = 'mega-icon-push';
						var ref = result[i].payload.ref.replace(/^.*\/(.*)$/, "$1");
						var body = result[i].payload.commits[0].message.length > 250 ? result[i].payload.commits[0].message.substring(0, 249)+'...' : result[i].payload.commits[0].message;
						msg = '&nbsp;pushed to&nbsp;<span class="well"><span class="mini-icon mini-icon-fork"></span>&nbsp;<a href="http://github.com/'+result[i].repo.name+'/tree/'+ref+'">'+ref+'</a>&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/><blockquote><a href="http://github.com/'+result[i].repo.html_url+'/commit/'+result[i].payload.commits[0].sha+'">'+result[i].payload.commits[0].sha.substring(0, 7)+'</a>&nbsp;'+body+'</blockquote>';
					break;
					case 'TeamAddEvent':
						icon = 'mega-icon-member-added';
					break;
					case 'WatchEvent':
						icon = 'mega-icon-watching';
						msg = '&nbsp;started watching&nbsp;'+repo+'<br/>';
					break;
				}
				x += '<div class="row-fluid"><div class="span1"><span class="mega-icon '+icon+'"></span></div><div class="span11">'+user+msg+'<small>'+date+'</small><br/><br/></div></div>';
			});
			$('#body').html(x+'<div class="row-fluid"><div class="span12">&nbsp;</div></div></div>');
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function repos() {
	$('#title').html('<h1>repositories</h1>');
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/repos',
		'',
		function(result){
			var x = '<div class="container-fluid">';
			$.each(result, function(i){
				var name = result[i].name;
				var url = result[i].html_url;
				var descript = result[i].description;
				var watchers = result[i].watchers_count;
				var forks = result[i].forks_count;
				var isfork = result[i].fork===true?'repo-forked':'repo';
				var date = result[i].created_at;
				var update = result[i].updated_at;
				x += '<div class="row-fluid"><div class="span1"><span class="octicon-repo mega-octicon octicon-'+isfork+'"></span></div><div class="span9"><h3><a href="'+url+'">'+name+'</a></h3>'+descript+'<br/><small>created: '+date+'<br/>last update: '+update+'</small></div><div class="span2 move-down"><span class="octicon octicon-star"></span>&nbsp;'+watchers+'<br/><span class="octicon octicon-git-branch"></span>&nbsp;'+forks+'</div></div>';
			});
			$('#body').html(x+'<div class="row-fluid"><div class="span12">&nbsp;</div></div></div>');
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function orgs() {
	$('#title').html('<h1>organizations</h1>');
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/orgs',
		'',
		function(result){
			var x = '<div class="container-fluid">';
			var j = 1;
			$.each(result, function(i){
				var name = result[i].login;
				var img = '<a href="http://github.com/'+result[i].login+'"><img src="'+result[i].avatar_url+'" alt="'+result[i].login+'" title="'+result[i].login+'" /></a>';
				if((j-1)%4 === 0){
					x +='<div clas="row-fluid"><div class="span3"><h6>'+name+'</h6>'+img+'</div>';
				} else if(j%4 === 0) {
					x+='<div class="span3"><h6>'+name+'</h6>'+img+'</div></div>';
				} else {
					x+='<div class="span3"><h6>'+name+'</h6>'+img+'</div>';
				}
				++j;
			});
			$('#body').html(x+'<div class="row-fluid"><div class="span12">&nbsp;</div></div></div>');
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function gists() {
	$('#title').html('<h1>gists</h1>');
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/gists',
		'',
		function(result){
			var x = '<div class="container-fluid">';
			$.each(result, function(i){
				var url = result[i].html_url;
				var descript = result[i].description;
				var date = result[i].created_at;
				var update = result[i].updated_at;
				var files = Object.keys(result[i].files).length;
				var comments = result[i].comments;
				var name = 'gist';
				$.each(result[i].files, function(i, e){
					name = e.filename;
					return;
				});
				x += '<div class="row-fluid"><div class="span1"><span class="mega-octicon octicon-gist"></span></div><div class="span9"><h3><a href="'+url+'">'+name+'</a></h3>'+descript+'<br/><small>created: '+date+'<br/>last update: '+update+'</small></div><div class="span2 move-down"><span class="octicon octicon-comment-discussion"></span>&nbsp;'+comments+'<br/><span class="octicon octicon-gist"></span>&nbsp;'+files+'<br/></div></div>';
			});
			$('#body').html(x+'<div class="row-fluid"><div class="span12">&nbsp;</div></div></div>');
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function following() {
	$('#title').html('<h1>following</h1>');
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/following',
		'',
		function(result){
			var x = '<div class="container-fluid">';
			var j = 1;
			$.each(result, function(i){
				var name = result[i].login;
				var img = '<a href="http://github.com/'+result[i].login+'"><img width="80" height="80" src="'+result[i].avatar_url+'" alt="'+result[i].login+'" title="'+result[i].login+'" /></a>';
				if((j-1)%4 === 0){
					x +='<div clas="row-fluid"><div class="span3"><h6>'+name+'</h6>'+img+'</div>';
				} else if(j%4 === 0) {
					x+='<div class="span3"><h6>'+name+'</h6>'+img+'</div></div>';
				} else {
					x+='<div class="span3"><h6>'+name+'</h6>'+img+'</div>';
				}
				++j;
			});
			$('#body').html(x+'<div class="row-fluid"><div class="span12">&nbsp;</div></div></div>');
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function followers() {
	$('#title').html('<h1>followers</h1>');
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/followers',
		'',
		function(result){
			var x = '<div class="container-fluid">';
			var j = 1;
			$.each(result, function(i){
				var name = result[i].login;
				var img = '<a href="http://github.com/'+result[i].login+'"><img width="80" height="80" src="'+result[i].avatar_url+'" alt="'+result[i].login+'" title="'+result[i].login+'" /></a>';
				if((j-1)%4 === 0){
					x +='<div clas="row-fluid"><div class="span3"><h6>'+name+'</h6>'+img+'</div>';
				} else if(j%4 === 0) {
					x+='<div class="span3"><h6>'+name+'</h6>'+img+'</div></div>';
				} else {
					x+='<div class="span3"><h6>'+name+'</h6>'+img+'</div>';
				}
				++j;
			});
			$('#body').html(x+'<div class="row-fluid"><div class="span12">&nbsp;</div></div></div>');
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function api(verb, url, data, success, error) {
	$.ajax({
		dataType: "json",
		type: verb,
		url: url,
		data: data,
		cache: true,
		success: success,
		error: error,
		beforeSend: function(jqXHR) {
			xhrPool.push(jqXHR);
		},
		complete: function(jqXHR, textStatus) {
			xhrPool = $.grep(xhrPool, function(x){
				return x!=jqXHR;
			});
		}
	});
};
function abortAjax() {
	$.each(xhrPool, function(idx, jqXHR) {
		jqXHR.abort();
	});
};
function timeAgo(time){
	var units = [
		{ name: "second", limit: 60, in_seconds: 1 },
		{ name: "minute", limit: 3600, in_seconds: 60 },
		{ name: "hour", limit: 86400, in_seconds: 3600  },
		{ name: "day", limit: 604800, in_seconds: 86400 },
		{ name: "week", limit: 2629743, in_seconds: 604800  },
		{ name: "month", limit: 31556926, in_seconds: 2629743 },
		{ name: "year", limit: null, in_seconds: 31556926 }
	];
	var diff = (new Date() - new Date(time*1000)) / 1000;
	if (diff < 5) return "now";

	var i = 0;
	while (unit = units[i++]) {
		if (diff < unit.limit || !unit.limit){
			var diff =  Math.floor(diff / unit.in_seconds);
			return (diff + " " + unit.name + (diff>1 ? "s" : ""))+' ago';
		}
	}
}