const { getSql } = require("../config/db");

const createMessage = async ({ senderId, recipientId, content }) => {
    const sql = getSql();
    const result = await sql`
        insert into messages (sender_id, recipient_id, content)
        values (${senderId}, ${recipientId}, ${content})
        returning id
    `;
    return result[0]?.id;
};

const getConversation = async (userId1, userId2, limit = 50) => {
    const sql = getSql();
    const messages = await sql`
        select 
            m.*,
            sender.name as sender_name,
            sender.username as sender_username,
            recipient.name as recipient_name,
            recipient.username as recipient_username
        from messages m
        join users sender on m.sender_id = sender.id
        join users recipient on m.recipient_id = recipient.id
        where 
            (m.sender_id = ${userId1} and m.recipient_id = ${userId2})
            or (m.sender_id = ${userId2} and m.recipient_id = ${userId1})
        order by m.created_at desc
        limit ${limit}
    `;
    return messages.reverse(); // Show oldest first
};

const getConversationsList = async (userId) => {
    const sql = getSql();
    const conversations = await sql`
        with latest_messages as (
            select 
                case 
                    when sender_id = ${userId} then recipient_id 
                    else sender_id 
                end as other_user_id,
                max(created_at) as last_message_time,
                count(case when recipient_id = ${userId} and not is_read then 1 end) as unread_count
            from messages 
            where sender_id = ${userId} or recipient_id = ${userId}
            group by other_user_id
        )
        select 
            lm.*,
            u.name as other_user_name,
            u.username as other_user_username,
            m.content as last_message_content,
            m.sender_id = ${userId} as last_message_from_me
        from latest_messages lm
        join users u on lm.other_user_id = u.id
        join messages m on m.created_at = lm.last_message_time
            and ((m.sender_id = ${userId} and m.recipient_id = lm.other_user_id)
                or (m.sender_id = lm.other_user_id and m.recipient_id = ${userId}))
        order by lm.last_message_time desc
    `;
    return conversations;
};

const markAsRead = async (userId, otherUserId) => {
    const sql = getSql();
    await sql`
        update messages 
        set is_read = true, updated_at = now()
        where recipient_id = ${userId} and sender_id = ${otherUserId} and not is_read
    `;
};

const getUnreadCount = async (userId) => {
    const sql = getSql();
    const result = await sql`
        select count(*) as unread_count
        from messages 
        where recipient_id = ${userId} and not is_read
    `;
    return parseInt(result[0]?.unread_count || 0);
};

module.exports = {
    createMessage,
    getConversation,
    getConversationsList,
    markAsRead,
    getUnreadCount,
};
