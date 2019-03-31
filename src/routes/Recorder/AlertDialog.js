import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const AlertDialog = ({ title, message, handleOnClose }) => {
    return (
        <Dialog
            open={!!(message && message.length > 0)}
            onClose={handleOnClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            {title ? (
                <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            ) : null}
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleOnClose} color="primary" autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
};

AlertDialog.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    handleOnClose: PropTypes.func,
};

export default AlertDialog;
