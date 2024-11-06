import React, { useRef, useEffect } from "react";
import { List, Box } from "@mui/material";
import { ChatMessageT } from "types/ApiTypes";
import ChatListItem from "./ChatListItem";

interface ChatListProps {
    messages: ChatMessageT[];
    currentUserID: number;
}

const ChatList: React.FC<ChatListProps> = ({ messages, currentUserID }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getColorFromString = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        const saturation = 30 + (hash % 20);
        const lightness = 70 + (hash % 10);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const groupMessagesByUserAndTime = (messages: ChatMessageT[]) => {
        const groupedMessages: {
            [key: string]: {
                user_id: number;
                timestamp: string;
                messages: ChatMessageT[];
            }[];
        } = {};
        let count = 0;
        messages.forEach((msg) => {
            const timestamp = new Date(msg.timestamp).toLocaleTimeString();
            if (!groupedMessages[msg.username + count.toString()]) {
                groupedMessages[msg.username + count.toString()] = [
                    {
                        user_id: msg.user_id,
                        timestamp: msg.timestamp,
                        messages: [msg],
                    },
                ];
            } else {
                const lastGroup =
                    groupedMessages[msg.username + count.toString()][
                        groupedMessages[msg.username + count.toString()]
                            .length - 1
                    ];
                const lastMessageTime = new Date(
                    lastGroup.messages[lastGroup.messages.length - 1].timestamp
                );
                const currentMessageTime = new Date(msg.timestamp);
                const timeDiff =
                    (currentMessageTime.getTime() - lastMessageTime.getTime()) /
                    1000 /
                    60;

                if (timeDiff <= 1) {
                    lastGroup.messages.push(msg);
                } else {
                    groupedMessages[msg.username + count.toString()].push({
                        user_id: msg.user_id,
                        timestamp,
                        messages: [msg],
                    });
                }
                count++;
            }
        });

        return groupedMessages;
    };

    const groupedMessages = groupMessagesByUserAndTime(messages);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column-reverse",
                overflowY: "auto",
                height: "100%",
            }}
        >
            <List>
                {Object.keys(groupedMessages)
                    .reverse()
                    .map((username) => (
                        <React.Fragment key={username}>
                            {groupedMessages[username]
                                .reverse()
                                .map((group, groupIndex) => {
                                    const isSender =
                                        group.user_id === currentUserID;
                                    return (
                                        <ChatListItem
                                            key={groupIndex}
                                            group={group}
                                            isSender={isSender}
                                            username={username}
                                            getColorFromString={
                                                getColorFromString
                                            }
                                        />
                                    );
                                })}
                        </React.Fragment>
                    ))}
                <div ref={messagesEndRef} />
            </List>
        </Box>
    );
};

export default ChatList;
