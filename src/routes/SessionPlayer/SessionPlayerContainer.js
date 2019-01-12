import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import SessionPlayer from './SessionPlayer';

const GET_SESSION = gql`
    query GetSession($id: ID!) {
        session(id: $id) {
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

export default ({ match }) => (
    <Query query={GET_SESSION} variables={{ id: match.params.sessionId }}>
        {({ loading, error, data }) => {
            if (loading) return null;
            if (error) return `Error: ${error}`;
            if (!data.session) return `404: Session not found`;
            if (data.session.segments.length === 0)
                return `Error: Session has no segments. Please create one with segments or handle this error more gracefully`;

            return <SessionPlayer segments={data.session.segments} />;
        }}
    </Query>
);
