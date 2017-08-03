// @flow

// const _debug = require( "debug" )( "Dashboard:Util" )
const _chalk = require( "chalk" )
const _boxen = require( "boxen" )
const { spawn } = require( "child_process" )
const M = require( "./m" )


const BOXEN_OPT = {
    padding: {
        top   : 0,
        bottom: 0,
        left  : 2,
        right : 2,
    },
}

export type ChildProcessType = child_process$ChildProcess

module.exports = {
    COLORS: {
        GRAY : "#f9f9f9",
        PINK : "#da7b7b",
        BLUE : "#7ba2f1",
        RED  : "#dc322f",
        GREEN: "#c3e88d",
    },

    infoText   : _chalk.blue,
    errorText  : _chalk.red,
    successText: _chalk.green,

    infoBox: ( input: string ) =>
        _chalk.blue.bgBlack( _boxen( input , BOXEN_OPT ) ),
    errorBox: ( input: string ) =>
        _chalk.red.bgBlack( _boxen( input, BOXEN_OPT ) ),
    successBox: ( input: string ) =>
        _chalk.green.bgBlack( _boxen( input , BOXEN_OPT ) ),

    /**
     * Start new child process, kill old one
     *
     * @param  {ChildProcessType}  current  Node child process
     * @param  {string}        cmd      Process command string
     * @param  {string[]}      args     Process arguments string
     *
     * @return {ChildProcessType}  Newly spawned child process
     */
    start: (
        current: ?ChildProcessType,
        cmd: string,
        args: string[] = []
    ): ChildProcessType =>
        M.pipe(
            M.if(
                M.isSomething,
                ( item: ChildProcessType ) => item.kill()
            ),
            () => spawn( cmd, args, {
                cwd      : process.cwd(),
                env      : process.env,
                detatched: false,
                encoding : "utf8",
            } )
        )( current ),

    /**
     * Pipe node child process output to blessed log element
     *
     * @param   {ChildProcessType}  childProcess  node child process
     * @param   {Blessed$Log}   logBox        blessed log element
     *
     * @return  {void}
     */
    pipe: (
        childProcess: ChildProcessType,
        logBox: Blessed$Log,
        stderr: boolean
    ) => {

        //
        childProcess.stdout.on( "data", ( data: Buffer ) => {
            logBox.log( data.toString() )
        } )

        //
        stderr || childProcess.stderr.on( "data", ( data: Buffer ) => {
            logBox.log( data.toString() )
        } )

        //
        childProcess.on( "exit", ( code: number, signal: string ) => {
            const logByType = code === 0 ? _chalk.green : _chalk.red

            logBox._.footer.setContent(
                logByType( [
                    `PID: ${childProcess.pid}`,
                    `stderr: ${stderr.toString()}`,
                    `code: ${code}`,
                    signal ? `signal: ${signal}` : "",
                ].filter( string => string.length !== 0 ).join( " | " ) )
            )
            logBox._.footer.parent.render()
        } )
    },
}