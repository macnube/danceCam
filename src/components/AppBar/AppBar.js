import React, { Component } from 'react';
import PropTypes from 'prop-types';
import compose from 'recompose/compose';
import 'video-react/dist/video-react.css';
import { default as BaseAppBar } from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import styles from './styles';

class AppBar extends Component {
    render() {
        const { classes, renderDesktop, renderMobile } = this.props;

        return (
            <div className={classes.root}>
                <BaseAppBar position="static">
                    <Toolbar>
                        <IconButton
                            className={classes.menuButton}
                            color="inherit"
                            aria-label="Open drawer"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            className={classes.title}
                            variant="h6"
                            color="inherit"
                            noWrap
                        >
                            Swing Dance Practice Partner
                        </Typography>
                        <div className={classes.grow} />
                        <div className={classes.sectionDesktop}>
                            {renderDesktop()}
                        </div>
                        <div className={classes.sectionMobile}>
                            {renderMobile()}
                        </div>
                    </Toolbar>
                </BaseAppBar>
            </div>
        );
    }
}

AppBar.propTypes = {
    classes: PropTypes.object.isRequired,
    renderDesktop: PropTypes.func.isRequired,
    renderMobile: PropTypes.func.isRequired,
};

export default compose(withStyles(styles))(AppBar);
