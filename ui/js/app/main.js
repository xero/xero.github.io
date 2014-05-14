var xhrPool = [];
	msgLoading = Handlebars.templates['loadingMsg'],
	msgSuccess = Handlebars.templates['successMsg'],
	msgError = Handlebars.templates['errorMsg'];
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
			$('#repoCount').html(result.public_repos);
			$('#gistCount').html(result.public_gists);
			$('#watchCount').html(result.following);
			$('#followCount').html(result.followers);
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
			$('#orgCount').html(result.length);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function activity() {
	var userActivity = Handlebars.templates['activity'];
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
							count = result[i].payload.commits.length,//result[i].payload.distinct_size, #BUG distinct_size = 0 if you push someone else's upstream commits to your fork repo.
							commit = count === 1 ? 'commit' : 'commits',
							ii = 1,
							first = result[i].payload.commits[0].sha.substring(0, 10),
							last = result[i].payload.commits[count-1].sha.substring(0, 10);
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
				x += userActivity({ 
					icon: icon,
					user: user,
					msg: msg,
					date: date
				});
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function repos() {
	var repo = Handlebars.templates['repos'];
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/repos?sort=pushed',
		'',
		function(result){
			var x = '';
			$.each(result, function(i){
				x += repo({
					name: result[i].name,
					url: result[i].html_url,
					language: result[i].language,
					zipball: result[i].owner.html_url+'/'+result[i].name+'/archive/master.zip',
					tarball: result[i].owner.html_url+'/'+result[i].name+'/archive/master.tar.gz',
					descript: result[i].description,
					watchers: result[i].watchers_count,
					forks: result[i].forks_count,
					isfork: result[i].fork===true ?
						'repo-forked' :
						'repo',
					date: timeAgo(new Date(result[i].created_at).getTime() / 1000),
					update: timeAgo(new Date(result[i].updated_at).getTime() / 1000)
				});
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function orgs() {
	var gridFirst = Handlebars.templates['gridFirst'],
		gridMid = Handlebars.templates['gridMid'],
		gridLast = Handlebars.templates['gridLast'],
		gridBody = Handlebars.templates['gridBody'];
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/orgs',
		'',
		function(result){
			var x = '',
				j = 1;
			$.each(result, function(i){
				var body = gridBody({ 
					login: result[i].login,
					avatar: result[i].avatar_url
				});
				if((j-1)%4 === 0){
					x += gridFirst({body: body});
				} else if(j%4 === 0) {
					x += gridLast({body: body});
				} else {
					x += gridMid({body: body});
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
	var gist = Handlebars.templates['gistOverview'],
		gistcode = Handlebars.templates['gistCode'];
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/gists',
		'',
		function(result){
			var x = '',
				total = result.length;
			$.each(result, function(i){
				var thename = '';
				$.each(result[i].files, function(i, e){
					thename = e.filename;
				});
				x += gist({
					id: i,
					url: result[i].html_url, 
					name: thename, 
					descript: result[i].description, 
					date: timeAgo(new Date(result[i].created_at).getTime() / 1000), 
					update: timeAgo(new Date(result[i].updated_at).getTime() / 1000), 
					comments: result[i].comments, 
					files: Object.keys(result[i].files).length
				});
				api(
					'GET',
					'https://api.github.com/gists/'+result[i].id,
					'', 
					function(result){
						var xx = '';
						$.each(result.files, function(ii, e){
							xx += gistcode({
								name: e.filename,
								raw_url: e.raw_url,
								size: humanFileSize(e.size),
								language: !e.language ? e.type : e.language,
								content: e.content.length > 6000 ? 
									e.content.substring(0, 6000)+'\n\n...' :
									e.content,
								link: e.content.length > 6000 ?
									'<a href="'+e.raw_url+'">view the entire file</a>' :
									''
							});
						});
						$('#gist-'+i).html(xx);
						if(i+1 === total) {
							hljs.initHighlighting();
						}
					}, 
					function(xhr, status, thrown){
						$('#gist-'+i).html(msgError);
					}
				);
			});
			$('#body').html(x);
		},
		function(xhr, status, thrown){
			$('#body').html(msgError);
		}
	);
};
function following() {
	var gridFirst = Handlebars.templates['gridFirst'],
		gridMid = Handlebars.templates['gridMid'],
		gridLast = Handlebars.templates['gridLast'],
		gridBody = Handlebars.templates['gridBody'];
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/following',
		'',
		function(result){
			var x = '',
				j = 1;
			$.each(result, function(i){
				var body = gridBody({ 
					login: result[i].login,
					avatar: result[i].avatar_url
				});
				if((j-1)%4 === 0){
					x += gridFirst({body: body});
				} else if(j%4 === 0) {
					x += gridLast({body: body});
				} else {
					x += gridMid({body: body});
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
	var gridFirst = Handlebars.templates['gridFirst'],
		gridMid = Handlebars.templates['gridMid'],
		gridLast = Handlebars.templates['gridLast'],
		gridBody = Handlebars.templates['gridBody'];
	$('#body').html(msgLoading);
	api(
		'GET',
		'https://api.github.com/users/xero/followers',
		'',
		function(result){
			var x = '',
				j = 1;
			$.each(result, function(i){
				var body = gridBody({ 
					login: result[i].login,
					avatar: result[i].avatar_url
				});
				if((j-1)%4 === 0){
					x += gridFirst({body: body});
				} else if(j%4 === 0) {
					x += gridLast({body: body});
				} else {
					x += gridMid({body: body});
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
function humanFileSize(size) {
	var i = Math.floor(Math.log(size) / Math.log(1024));
	return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
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
$(document).ready(function() {
	init();
	activity();
});
