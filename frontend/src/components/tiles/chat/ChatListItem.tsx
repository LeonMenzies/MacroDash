import React from "react";
import { ListItem, ListItemText, Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ChatMessageT } from "types/ApiTypes";

interface ChatListItemProps {
    group: { user_id: number; timestamp: string; messages: ChatMessageT[] };
    isSender: boolean;
    username: string;
    getColorFromString: (str: string) => string;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
    group,
    isSender,
    username,
    getColorFromString,
}) => {
    const formatTimestamp = (timestamp: string) => {
        const messageDate = new Date(timestamp);
        const now = new Date();
        const oneDayInMillis = 24 * 60 * 60 * 1000;

        if (now.getTime() - messageDate.getTime() > oneDayInMillis) {
            return messageDate.toLocaleString();
        } else {
            return messageDate.toLocaleTimeString();
        }
    };

    return (
        <Box
            sx={{
                m: "10px",
                display: "flex",
                alignItems: isSender ? "flex-end" : "flex-start",
                overflow: "hidden",
            }}
        >
            {!isSender && (
                <Avatar
                    sx={{
                        marginTop: "10px",
                        marginRight: "5px",
                        width: 30,
                        height: 30,
                        bgcolor: getColorFromString(username),
                        "&:hover .username": {
                            opacity: 1,
                        },
                    }}
                >
                    {username.charAt(0)}
                </Avatar>
            )}

            <Box
                sx={{
                    width: "100%",
                }}
            >
                <Username
                    sx={{
                        display: "flex",
                        flexDirection: isSender ? "row-reverse" : "row",
                        alignItems: "center",
                        p: "2px",
                    }}
                    className="username"
                >
                    {username}
                </Username>
                {group.messages.map((msg, index) => (
                    <ListItem
                        key={index}
                        sx={{
                            display: "flex",
                            flexDirection: isSender ? "row-reverse" : "row",
                            alignItems: "center",
                            p: "2px",
                        }}
                    >
                        <ChatBubble
                            sx={{
                                backgroundColor: isSender
                                    ? "primary.light"
                                    : "background.default",
                                color: isSender
                                    ? "primary.contrastText"
                                    : "text.primary",
                            }}
                        >
                            <ListItemText
                                primary={msg.message}
                                primaryTypographyProps={{
                                    variant: "body2",
                                }}
                            />
                        </ChatBubble>
                    </ListItem>
                ))}
                <Timestamp
                    sx={{
                        display: "flex",
                        flexDirection: isSender ? "row-reverse" : "row",
                        alignItems: "center",
                        pl: "4px",
                        pr: "4px",
                    }}
                    className="timestamp"
                >
                    {formatTimestamp(group.timestamp)}
                </Timestamp>
            </Box>
        </Box>
    );
};

const ChatBubble = styled(Box)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    padding: "2px 6px",
    boxShadow: theme.shadows[1],
    maxWidth: "60%",
    wordWrap: "break-word",
    overflowWrap: "break-word",
}));

const Timestamp = styled(Typography)(({ theme }) => ({
    fontSize: "x-small",
    opacity: 1,
    transition: "opacity 0.3s ease-in-out",
}));

const Username = styled(Typography)(({ theme }) => ({
    fontSize: "x-small",
    opacity: 0,
    transition: "opacity 0.3s ease-in-out",
}));

export default ChatListItem;
