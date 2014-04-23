var xhrPool = [];
	msgLoading = '<div class="row"><div class="xs-col-12"><div class="alert alert-info alert-block"><h1><span class="mega-octicon octicon-hourglass"></span>&nbsp;loading</h1><p>accessing the github api...</p></div></div></div>',
	msgSuccess = '<div class="row"><div class="xs-col-12"><div class="alert alert-success alert-block"><h1><span class="mega-octicon octicon-issue-opened"></span>&nbsp;success!</h1><p>loaded data from the github api.</p></div></div></div>',
	msgError = '<div class="row"><div class="xs-col-12"><div class="alert alert-error alert-block"><h1><span class="mega-octicon octicon-issue-opened"></span>&nbsp;error!</h1><p>failed to load data from the github api.</p></div></div></div>';
function init() {
	overview();
	$('#navActivity').on('click', function(){
		menu(this);
		abortAjax();
		activity();
	});
	$('#navRepos').on('click', function(){
		menu(this);
		abortAjax();
		repos();
	});
	$('#navOrgs').on('click', function(){
		menu(this);
		abortAjax();
		orgs();
	});
	$('#navGists').on('click', function(){
		menu(this);
		abortAjax();
		gists();
	});
	$('#navWatch').on('click', function(){
		menu(this);
		abortAjax();
		following();
	});
	$('#navFollow').on('click', function(){
		menu(this);
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
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/events',
		'',
		function(result){
			var x = '<div class="container">';
			$.each(result, function(i){
				var user = '<a href="https://github.com/'+result[i].actor.login+'">'+result[i].actor.login+'</a>',
					repo = '<a href="https://github.com/'+result[i].repo.name+'">'+result[i].repo.name+'</a>',
					date = timeAgo(new Date(result[i].created_at).getTime() / 1000),
					icon = 'octicon-mark-github',
					msg = '<br/>';
				switch(result[i].type) {
					case 'ReleaseEvent':
						icon = 'octicon-package';
						msg = '&nbsp;released&nbsp;<span class="well"><a href="'+result[i].payload.release.zipball_url+'"><span class="octicon octicon-cloud-download"></span></a>&nbsp;<a href="'+result[i].payload.release.html_url+'">'+result[i].payload.release.name+'</a></span>&nbsp;at&nbsp;'+repo+'<br/>';
					break;
					case 'CommitCommentEvent':
						icon = 'octicon-comment-discussion';
						var body = result[i].payload.comment.body.length > 250 ? result[i].payload.comment.body.substring(0, 249)+'...' : result[i].payload.comment.body;
						msg = '&nbsp;commented on commit: '+repo+' / <a href="'+result[i].payload.comment.html_url+'">'+result[i].payload.comment.commit_id.substring(0, 10)+'</a><br/><blockquote>'+body+'</blockquote>';
					break;
					case 'CreateEvent':
						var type = result[i].payload.ref_type;
						switch(type) {
							case 'branch':
								icon = 'octicon-git-branch-create';
								msg = '&nbsp;created&nbsp;'+type+'&nbsp;<span class="well"><span class="octicon octicon-git-branch-create"></span>&nbsp;'+result[i].payload.ref+'&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>';
							break;
							case 'tag':
								icon = 'octicon-tag-add';
								msg = '&nbsp;created&nbsp;'+type+'&nbsp;<span class="well"><span class="octicon octicon-tag-add"></span>&nbsp;'+result[i].payload.ref+'&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>';
							break;
							case 'repository':
							default:
								icon = 'octicon-repo-create';
								msg = '&nbsp;created&nbsp;'+type+'&nbsp;<span class="well"><span class="octicon octicon-repo-create"></span>&nbsp;'+repo+'&nbsp;</span><br/>';
							break;
						}
					break;
					case 'DeleteEvent':
						var ref = result[i].payload.ref,
							type = result[i].payload.ref_type;
						switch(type) {
							case 'branch':
								icon = 'octicon-git-branch-delete';
								var mini = 'octicon-git-branch-delete';
							break;
							case 'repo':
								icon = 'octicon-repo-delete';
								var mini = 'octicon-repo-delete';
							break;
							case 'tag':
								icon = 'octicon-tag-remove';
								var mini = 'octicon-tag-remove';
							break;
						}
						msg = '&nbsp;deleted&nbsp;'+type+'&nbsp;<span class="well"><span class="octicon '+mini+'"></span>&nbsp;'+ref+'&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>';
					break;
					case 'DownloadEvent':
						icon = 'octicon-cloud-download';
					break;
					case 'FollowEvent':
						icon = 'octicon-person-follow';
						msg = '&nbsp;started following&nbsp;<a href="'+result[i].payload.target.html_url+'">'+result[i].payload.target.login+'</a><br/>';
					break;
					case 'ForkEvent':
						icon = 'octicon-repo-forked';
						msg = '&nbsp;forked&nbsp;'+repo+'&nbsp;into&nbsp;<span class="well"><span class="octicon octicon-repo-forked"></span>&nbsp;<a href="https://github.com/'+result[i].payload.forkee.full_name+'">'+result[i].payload.forkee.full_name+'</a>&nbsp;</span><br/>';
					break;
					case 'ForkApplyEvent':
						icon = 'octicon-git-branch';
					break;
					case 'GistEvent':
						icon = '.octicon-git-gist';
					break;
					case 'GollumEvent':
						icon = 'octicon-file-text';
						msg = '&nbsp;created the <a href="'+result[i].payload.pages.html_url+'">'+result[i].payload.pages[0].title+'</a> page in the '+repo+' wiki.<br/>';
					break;
					case 'IssueCommentEvent':
						var body = result[i].payload.issue.body.length > 250 ? result[i].payload.comment.body.substring(0, 249)+'...' : result[i].payload.comment.body;
						msg = '&nbsp;commented on issue: '+repo+' / <a href="'+result[i].payload.issue.html_url+'">'+result[i].payload.issue.title+'</a><br/><blockquote>'+body+'</blockquote>';
						icon = 'octicon-comment-add';
					break;
					case 'IssuesEvent':
						var action = result[i].payload.action,
							body = result[i].payload.issue.body.length > 250 ? result[i].payload.issue.body.substring(0, 249)+'...' : result[i].payload.issue.body;
						msg = '&nbsp;'+action+'&nbsp;issue&nbsp;'+repo+'&nbsp;/&nbsp;<a href="'+result[i].payload.issue.html_url+'">'+result[i].payload.issue.title+'</a><blockquote>'+body+'</blockquote>';
						switch(action) {
							case 'reopened':
								icon = 'octicon-issue-reopened';
							break;
							case 'closed':
								icon = 'octicon-issue-closed';
							break;
							case 'opened':
							default:
								icon = 'octicon-issue-opened';
							break;
						}
					break;
					case 'MemberEvent':
						icon = 'octicon-person';
						msg = '&nbsp;'+result[i].payload.action+'&nbsp;member&nbsp;<a href="https://github.com/'+result[i].payload.member.login+'">'+result[i].payload.member.login+'</a>&nbsp;to&nbsp;'+repo+'<br/>';
					break;
					case 'PublicEvent':
						icon = 'octicon-megaphone';
					break;
					case 'PullRequestEvent':
						icon = 'octicon-git-pull-request';
						msg = '&nbsp;'+result[i].payload.action+'&nbsp; a pull request:&nbsp;<a href="'+result[i].payload.pull_request.html_url+'">'+result[i].repo.name+'/#'+result[i].payload.number+'</a><br/><blockquote><a href="'+result[i].payload.pull_request.head.repo.html_url+'/commit/'+result[i].payload.pull_request.head.sha+'">'+result[i].payload.pull_request.head.sha.substring(0, 10)+'</a>&nbsp;'+result[i].payload.pull_request.title+'</blockquote>';
					break;
					case 'PullRequestReviewCommentEvent':
						icon = 'octicon-comment';
					break;
					case 'PushEvent':
						icon = 'octicon-repo-push';
						var ref = result[i].payload.ref.replace(/^.*\/(.*)$/, "$1"),
							body = '',
							count = result[i].payload.distinct_size,
							commit = count === 1 ? 'commit' : 'commits',
							ii = 1,
							first = result[i].payload.commits[0].sha.substring(0, 10),
							last = result[i].payload.commits[count-1].sha.substring(0, 10)
						if(count === 1) {
							body += '<blockquote><a href="https://github.com/'+result[i].repo.name+'/commit/'+result[i].payload.commits[ii-1].sha+'">'+result[i].payload.commits[ii-1].sha.substring(0, 10)+'</a>&nbsp;'+(result[i].payload.commits[ii-1].message.length > 250 ? result[i].payload.commits[ii-1].message.substring(0, 249)+'...' : result[i].payload.commits[ii-1].message)+'</blockquote>';
						} else if(count > 4) {
							while(ii <= 5) {
								body += '<blockquote><a href="https://github.com/'+result[i].repo.name+'/commit/'+result[i].payload.commits[ii-1].sha+'">'+result[i].payload.commits[ii-1].sha.substring(0, 10)+'</a>&nbsp;'+(result[i].payload.commits[ii-1].message.length > 250 ? result[i].payload.commits[ii-1].message.substring(0, 249)+'...' : result[i].payload.commits[ii-1].message)+'</blockquote>';
								ii++;
							}
							body += '<a href="https://github.com/'+result[i].repo.name+'/compare/'+first+'...'+last+'">compare these commits and '+(count-5)+' others &raquo;</a>';
						} else {
							while(ii <= count) {
								body += '<blockquote><a href="https://github.com/'+result[i].repo.name+'/commit/'+result[i].payload.commits[ii-1].sha+'">'+result[i].payload.commits[ii-1].sha.substring(0, 10)+'</a>&nbsp;'+(result[i].payload.commits[ii-1].message.length > 250 ? result[i].payload.commits[ii-1].message.substring(0, 249)+'...' : result[i].payload.commits[ii-1].message)+'</blockquote>';
								ii++;
							}
							body += '<a href="https://github.com/'+result[i].repo.name+'/compare/'+first+'...'+last+'">compare these commits &raquo;</a>';
						}

						msg = '&nbsp;pushed&nbsp;'+count+'&nbsp;'+commit+' to&nbsp;<span class="well"><span class="octicon octicon-git-branch"></span>&nbsp;<a href="https://github.com/'+result[i].repo.name+'/tree/'+ref+'">'+ref+'</a>&nbsp;</span>&nbsp;at&nbsp;'+repo+'<br/>'+body;
					break;
					case 'TeamAddEvent':
						icon = 'octicon-person-add';
					break;
					case 'WatchEvent':
						icon = 'octicon-eye-watch';
						msg = '&nbsp;started watching&nbsp;'+repo+'<br/>';
					break;
				}
				x += '<div class="row well"><div class="col-xs-1 icon"><span class="mega-octicon '+icon+'"></span></div><div class="col-xs-11"><div class="row"><div class="col-xs-12 msg">'+user+msg+'</div><div class="col-xs-12 date"><small>'+date+'</small></div></div></div></div>';
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function repos() {
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/repos?sort=pushed',
		'',
		function(result){
			var x = '<div class="container">';
			$.each(result, function(i){
				var name = result[i].name,
					url = result[i].html_url,
					descript = result[i].description,
					watchers = result[i].watchers_count,
					forks = result[i].forks_count,
					isfork = result[i].fork===true?'repo-forked':'repo',
					date = timeAgo(new Date(result[i].created_at).getTime() / 1000),
					update = timeAgo(new Date(result[i].updated_at).getTime() / 1000);
				x += '<div class="row well repo"><div class="col-xs-1 icon"><span class="mega-octicon octicon-repo octicon-'+isfork+'"></span></div><div class="col-xs-10"><div class="row"><div class="col-xs-12"><h3><a href="'+url+'">'+name+'</a></h3></div></div><div class="row"><div class="col-xs-12 msg"><blockquote>'+descript+'</blockquote></div></div><div class="row"><div class="col-xs-12 date"><small>created: '+date+'</small></div></div><div class="row"><div class="col-xs-12 date"><small>updated: '+update+'</small></div></div></div><div class="col-xs-1 meta"><aside><div class="line"><span class="octicon octicon-star"></span>&nbsp;'+watchers+'</div><div class="line"><span class="octicon octicon-git-branch"></span>&nbsp;'+forks+'</div></aside></div></div>';
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function orgs() {
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/orgs',
		'',
		function(result){
			var x = '<div class="container">',
				j = 1;
			$.each(result, function(i){
				var body = '<h4><a href="https://github.com/'+result[i].login+'">'+result[i].login+'</a></h4><a href="https://github.com/'+result[i].login+'"><img src="'+result[i].avatar_url+'" alt="'+result[i].login+'" title="'+result[i].login+'" width="80" height="80" /></a>';
				if((j-1)%4 === 0){
					x +='<div clas="row"><div class="col-xs-3"><div class="well small">'+body+'</div></div>';
				} else if(j%4 === 0) {
					x+='<div class="col-xs-3"><div class="well small">'+body+'</div></div></div>';
				} else {
					x+='<div class="col-xs-3"><div class="well small">'+body+'</div></div>';
				}
				++j;
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function gists() {
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/gists',
		'',
		function(result){
			var x = '<div class="container">';
			$.each(result, function(i){
				var url = result[i].html_url,
					descript = result[i].description,
					date = timeAgo(new Date(result[i].created_at).getTime() / 1000),
					update = timeAgo(new Date(result[i].updated_at).getTime() / 1000),
					files = Object.keys(result[i].files).length,
					comments = result[i].comments,
					name = 'gist';
				$.each(result[i].files, function(i, e){
					name = e.filename;
					return;
				});
				x += '<div class="row well repo"><div class="col-xs-1 icon"><span class="mega-octicon octicon-gist"></span></div><div class="col-xs-10"><div class="row"><div class="col-xs-12"><h3><a href="'+url+'">'+name+'</a></h3></div></div><div class="row"><div class="col-xs-12 msg"><blockquote>'+descript+'</blockquote></div></div><div class="row"><div class="col-xs-12 date"><small>created: '+date+'</small></div></div><div class="row"><div class="col-xs-12 date"><small>updated: '+update+'</small></div></div></div><div class="col-xs-1 meta"><aside><div class="line"><span class="octicon octicon-comment-discussion"></span>&nbsp;'+comments+'</div><div class="line"><span class="octicon octicon-gist"></span>&nbsp;'+files+'</div></aside></div></div>';
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function following() {
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/following',
		'',
		function(result){
			var x = '<div class="container">',
				j = 1;
			$.each(result, function(i){
				var body = '<h4><a href="https://github.com/'+result[i].login+'">'+result[i].login+'</a></h4><a href="https://github.com/'+result[i].login+'"><img width="80" height="80" src="'+result[i].avatar_url+'" alt="'+result[i].login+'" title="'+result[i].login+'" /></a>';
				if((j-1)%4 === 0){
					x +='<div clas="row"><div class="col-xs-3"><div class="well small">'+body+'</div></div>';
				} else if(j%4 === 0) {
					x+='<div class="col-xs-3"><div class="well small">'+body+'</div></div></div>';
				} else {
					x+='<div class="col-xs-3"><div class="well small">'+body+'</div></div>';
				}
				++j;
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function followers() {
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/followers',
		'',
		function(result){
			var x = '<div class="container">',
				j = 1;
			$.each(result, function(i){
				var body = '<h4><a href="https://github.com/'+result[i].login+'">'+result[i].login+'</a></h4><a href="https://github.com/'+result[i].login+'"><img width="80" height="80" src="'+result[i].avatar_url+'" alt="'+result[i].login+'" title="'+result[i].login+'" /></a>';
				if((j-1)%4 === 0){
					x +='<div clas="row"><div class="col-xs-3"><div class="well small">'+body+'</div></div>';
				} else if(j%4 === 0) {
					x +='<div class="col-xs-3"><div class="well small">'+body+'</div></div></div>';
				} else {
					x +='<div class="col-xs-3"><div class="well small">'+body+'</div></div>';
				}
				++j;
			});
			$('#body').html(x);
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
function menu(obj) {
	$('#navActivity').removeClass('active');
	$('#navRepos').removeClass('active');
	$('#navOrgs').removeClass('active');
	$('#navGists').removeClass('active');
	$('#navWatch').removeClass('active');
	$('#navFollow').removeClass('active');
	$(obj).addClass('active');
}
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
$(document).ready(function() {
	init();
	activity();
});
