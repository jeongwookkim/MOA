const express = require("express");
const router = express.Router();
const Room = require("../models").Room;

// room class
class cRoom{
    constructor(id, room_name, is_secret, master){
        this.room_id = id;
        this.room_name = room_name;
        this.is_secret = is_secret;
        this.headcount = 1;
        this.master = master;
        this.clients = [];    // 여기에 소켓, 닉네임 정도 일단 넣기
    }
}

// room array
let rooms = [];

////////////////////////////////////////////////////////////////////////
// room list req
////////////////////////////////////////////////////////////////////////
router.post("/enter", async (req, res) => {
    const enter_room = rooms.filter((value) => { return value.room_id === req.body.id });
    console.log(enter_room);
    // 활성화 된 방이면 그냥 들어가면 됨
    if(enter_room.length){
        // 있는 방 찾아 들어가기
        enter_room[0].headcount += 1;
        res.json({
            resultCode: true, 
            msg: { 
                room_id:enter_room[0].room_id,
                room_name: enter_room[0].room_name,
                is_secret: enter_room[0].is_secret,
                headcount: enter_room[0].headcount,
                master: enter_room[0].master,
            }
        });
    } else {
        try{
            const find_result = await Room.findOne({ where: { id: req.body.id }});
            if(find_result){
                const RoomItem = new cRoom(find_result.id, find_result.room_name, find_result.is_secret, find_result.master_id);
                rooms.push(RoomItem);
                console.log(rooms);
                res.json({ 
                    resultCode: true, 
                    msg: { 
                        room_id: RoomItem.room_id,
                        room_name: RoomItem.room_name,
                        is_secret: RoomItem.is_secret,
                        headcount: RoomItem.headcount,
                        master: RoomItem.master,
                    }  
                });
            } else {
                console.log("방을 찾을 수 없음");
                res.json({ resultCode: false, msg: "잠시 후 다시 시도해주세요" });
            } 
        } catch(err) {
            console.log(err);
        }
    }
});

////////////////////////////////////////////////////////////////////////
// room list req
////////////////////////////////////////////////////////////////////////
router.get("/", async (req, res) => {
    try{
        // 자기 방만 나올수 있도록 쿼리
        const find_result = await Room.findAll({ where: { is_secret: false }});

        res.json({ 
            resultCode: true, 
            msg: { 
                public_rooms: rooms.filter((value => {
                    return value.is_secret === false;
                })), 
                my_rooms: find_result,
            }
        });
    } catch(err) {
        console.log(err);
        res.json({ resultCode: false, msg: "방 불러오기 오류" });
    }
});

////////////////////////////////////////////////////////////////////////
// room create req
////////////////////////////////////////////////////////////////////////
router.post("/create", async (req, res) => {
    const room_name = req.body.title;
    const room_url = req.body.url;
    const is_secret = req.body.isSecret;

    try{
        let insert_result;
        if(req.body.isSecret){
            const password = req.body.password;
            insert_result = await Room.create({ room_name, room_url, is_secret, password, master_id: req.session.id });
        } else {
            insert_result = await Room.create({ room_name, room_url, is_secret, master_id: req.session.id });
        }

        res.json({ resultCode: true, msg:"미팅룸 생성이 완료되었습니다"});
    } catch(err) {
        res.json({ resultCode: false, msg:"미팅룸 생성이 실패"});
    }
});

module.exports = router;