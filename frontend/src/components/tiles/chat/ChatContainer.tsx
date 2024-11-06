import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, TextField, Button, Paper, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";
import io from "socket.io-client";
import { useRecoilValue } from "recoil";
import { userAtom } from "recoil/user";
import ChatList from "./ChatList";
import useFetchApi from "hooks/useFetchApi";
import { ChatMessageT } from "types/ApiTypes";

export interface ChatContainerProps {}

export const ChatContainer = (props: ChatContainerProps) => {
    const socket = useRef(io("http://localhost:4001")); // Connect to backend on port 4001

    const [messages, setMessages] = useState<ChatMessageT[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const user = useRecoilValue(userAtom);
    const [fetchMessagesResponse, fetchMessagesLoading, fetchMessages] =
        useFetchApi<ChatMessageT[]>("/chat/messages");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        const currentSocket = socket.current;

        currentSocket.on("connect", () => {
            setIsConnected(true);
        });

        currentSocket.on("disconnect", () => {
            setIsConnected(false);
        });

        currentSocket.on("message", (msg: any) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        return () => {
            currentSocket.off("connect");
            currentSocket.off("disconnect");
            currentSocket.off("message");
        };
    }, []);

    useEffect(() => {
        if (fetchMessagesResponse.success && fetchMessagesResponse.data) {
            setMessages(fetchMessagesResponse.data);
        }
    }, [fetchMessagesResponse]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = useCallback(() => {
        if (newMessage.trim() === "") return;
        const messageData = { user_id: user.id, message: newMessage };
        socket.current.emit("message", messageData);
        setNewMessage("");
    }, [newMessage, user.id]);

    const handleKeyPress = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter") {
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    return fetchMessagesLoading ? (
        <Skeleton variant="rectangular" width="100%" height="100%" />
    ) : (
        <StyledChatContainer>
            <MessagesContainer elevation={3}>
                <ChatList messages={messages} currentUserID={user.id} />
                <div ref={messagesEndRef} />
            </MessagesContainer>
            <TextField
                label="Message"
                variant="outlined"
                size="small"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleKeyPress}
                fullWidth
                sx={{ marginBottom: 2 }}
            />
            <Button
                variant="contained"
                size="small"
                color="primary"
                onClick={handleSendMessage}
                disabled={!isConnected}
                fullWidth
            >
                {isConnected ? "Send" : "Disconnected"}
            </Button>
        </StyledChatContainer>
    );
};

const StyledChatContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    boxShadow: theme.customShadows.light,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
}));

const MessagesContainer = styled(Paper)(({ theme }) => ({
    flex: 1,
    maxHeight: "calc(100% - 100px)",
    overflowY: "auto",
    overflowX: "hidden",
    marginBottom: theme.spacing(2),
}));
