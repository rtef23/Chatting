$(function(){
	//socket.off('server_friend');
	socket.on('server_member', function(msg){
		switch(msg.action){
			case 'response':
			{
				switch(msg.value.call){
					case 'r_member':
					{
						switch(msg.value.result){
							case 0:
								alert('유저 정보를 읽어 올 수 없습니다.\n잠시 후 다시 시도해 주세요.');
							break;
							case 1:
								renderProfile(msg.value.data);
							break;
						}
					}
					break;
					case 'u_member':
					{
						switch(msg.value.result){
							case 0://fail
								alert('회원 업데이트에 실패 했습니다.\n잠시후 다시 시도해 주세요.');
							break;
							case 1://success, do nothing
								alert('회원 정보 변경에 성공하였습니다.');
							break;
						}
					}
					break;
				}
			}
			break;
		}
	});

	socket.on('server_friend', function(msg){
		var action = msg.action;
		switch(action){
			case 'response':
			{
				var value = msg.value;
				switch(value.call){
					case 'r_friend':
					{
						var result = value.result;
						switch(result){
							case 0:
							alert('친구 목록을 불러오는데 실패 했습니다.\n다시 시도해 주세요.');
							break;
							case 1:
							{
								renderFriendList(value.data);
							}
							break;
						}
					}
					break;

					case 'd_friend':
					{
						switch(value.result){
							case 0://fail
								alert('친구 삭제에 실패 했습니다.\n잠시 후 다시 시도해 주세요.');
							break;
							case 1://success
								alert(value.friend_id + ' 의 친구 삭제에 성공하였습니다.');
								resetFriendIDInput();
								deleteFriend(value.friend_id);
							break;
						}
					}
					break;
				}
			}
			break;

			case 'update':
			{
				updateFriendState(msg.value);
			}
			break;

			case 'delete':
			{
				deleteFriend(msg.value.friend_id);
			}
			break;
		}
	});

	socket.on('server_friendRequest', function(msg){
		var action = msg.action;
		switch(action){
			case 'create':
			{
				friend_request_count++;
				renderLoginTab();
				if(current_document == 'friend_request'){
					createFriendRequest(msg.value);
				}
			}
			break;
			case 'response':
			{
				switch(msg.value.call){
					case 'c_friendRequest':
					{
						switch(msg.value.result){
							case 0:
							alert('친구 요청하려는 친구 아이디를 확인하세요.');
							break;
							case 1://success
							alert(msg.value.friend_id + ' 에게 친구 요청을 보냈습니다.');
							resetFriendIDInput();
							break;
							case 2://error
							alert('친구 요청에 실패 했습니다.\n잠시 후 다시 시도해 주세요.');
							break;
						}
					}
					break;
					case 'r_friendRequest':
					{
						switch(msg.value.result){
							case 0://fail
							alert('친구 요청 목록을 불러오는데 실패 했습니다.\n다시 시도해 주세요.');
							return;
							case 1://success
							break;
						}
						friend_request_count = msg.value.data.length;
						renderLoginTab();
						if(current_document == 'friend_request'){
							renderFriendRequests(msg.value.data);
						}
					}
					break;
					case 'u_friendRequest':
					{
						switch(msg.value.result){
							case 0://fail
								alert('친구 요청을 수락하는데 실패 했습니다.\n잠시후 다시 시도해주세요.');
							break;
							case 1://success
								friend_request_count--;
								renderLoginTab();
								deleteFriendRequest(msg.value.friend_id);
								addFriend(msg.value);
							break;
						}
					}
					break;
					case 'd_friendRequest':
					{
						switch(msg.value.result){
							case 0://fail
								alert('친구 요청을 거절하는데 실패 했습니다.\n잠시 후 다시 시도 해주세요.');
							break;
							case 1://success
								friend_request_count--;
								renderLoginTab();
								deleteFriendRequest(msg.value.friend_id);
							break;
						}
					}
					break;
				}
			}
			break;

			case 'update':
			{
				addFriend(msg.value);
			}
			break;

			case 'delete':
			{

			}
			break;

		}
	});
	
	socket.on('server_room', function(msg){
		var action = msg.action;
		switch(action){
			case 'response':
			{
				var value = msg.value;
				switch(value.call){
					case 'c_room':
					{
						switch(value.result){
							case 0://fail
							{
								alert(value.room_title + ' 의 방을 생성하는데 실패 했습니다.\n잠시 후 다시 시도해 주세요.');
							}
							break;
							case 1://success
							{
								room_count++;
								renderLoginTab();
								resetRoomTitle();
								addRoom({
									room_id : value.room_id,
									room_title : value.room_title,
									members : value.members
								});
								alert(room_title + ' 의 방을 생성하였습니다.');
							}
							break;
						}
					}
					break;
					case 'r_room_all' : 
					{
						switch(value.result){
							case 0://fail
							{
								alert('방 장보들을 읽어오는데 실패 했습니다.\n잠시 후 다시 시도해 주세요.');
							}
							break;
							case 1://success
							{
								room_count = value.data.length;
								renderLoginTab();
								if(current_document == 'rooms')
									renderRooms(value.data);
							}
							break;
						}
					}
					break;
				}
			}
			break;
		}
	});

	socket.on('server_roomInvite', function(msg){
		var action = msg.action;
		switch(action){
			case 'response':
			{
				var call = msg.value.call;
				switch(call){
					case 'c_roomInvite':
					{
						switch(msg.value.result){
							case 0://fail
							{
								alert(msg.value.target_id + ' 에게 방 초대요청을 보내는 데 실패 했습니다.\n잠시 후 다시 시도해 주세요.');
							}
							break;
							case 1://success
							{
								alert(msg.value.target_id + ' 에게 방 초대 요청을 보냈습니다.');
							}
							break;
						}
					}
					break;
					case 'r_roomInvite':
					{
						switch(msg.value.result){
							case 0://fail
							{
								alert('방 초대 목록을 불러오는데 실패 했습니다.\n잠시후 다시 시도 해 주세요.');
							}
							break;
							case 1://success
							{
								room_invite_count = msg.value.data.length;
								renderLoginTab();
								if(current_document == 'room_requests')
									renderRoomInvite(msg.value.data);
							}
							break;
						}
					}
					break;
				}
			}
			break;
			case 'update':
			{
				room_count++;
				renderLoginTab();
				addRoomInv(msg.value);
			}
			break;
		}
	});
});