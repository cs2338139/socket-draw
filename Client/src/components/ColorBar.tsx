interface Props {
    color: string
}

function ColorBar(props: Props) {
    const { color } = props;
    return (
        <div style={{ background: color }} className="mt-2 h-5 w-full border border-black" ></div >
    );
}

export default ColorBar;