import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import SessionCreator from './SessionCreator';
import { Redirect } from 'react-router';

const CREATE_SESSION = gql`
    mutation CreateSession($data: SessionCreateInput!) {
        createSession(data: $data) {
            id
            segments {
                id
                name
                videoId
                startTime
                endTime
            }
        }
    }
`;

export default () => (
    <Mutation mutation={CREATE_SESSION}>
        {(createSession, { data, loading, error }) => {
            if (loading) return null;
            if (error) return `Error: ${error}`;
            if (data)
                return (
                    <SessionCreator
                        sessionId={data.createSession.id}
                        success={true}
                        createSession={createSession}
                    />
                );

            return <SessionCreator createSession={createSession} />;
        }}
    </Mutation>
);
