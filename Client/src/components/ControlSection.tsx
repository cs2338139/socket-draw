import { MethodType } from '@interfaces/MethodType.ts'

interface Props {
  isSocketConnect: Boolean,
  startSocket: () => void,
  methodTypeValueProps: {
    methodTypeValue: string,
    setMethodTypeValue: (value: string) => void
  },
  methodTypeList: { [key: string]: MethodType },
  handleImage: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function ControlSection(props: Props) {
  const { isSocketConnect, startSocket, methodTypeValueProps, methodTypeList, handleImage } = props
  const { methodTypeValue, setMethodTypeValue } = methodTypeValueProps

  return (
    <div className="flex items-center gap-5">
      <button className="border border-black px-3 py-1" onClick={startSocket}>
        {isSocketConnect ? 'disconnect' : 'connect'}
      </button>

      <select
        value={methodTypeValue}
        onChange={(e) => { setMethodTypeValue(e.target.value) }}
        className={`${isSocketConnect ? 'block' : 'hidden'} h-10 w-40 border border-black px-1 py-0.5 text-center text-lg text-black`}>
        {
          Object.keys(methodTypeList).map((key) => {
            return (
              <option key={key} value={methodTypeList[key].value}>
                {methodTypeList[key].name}
              </option>
            )
          })
        }
      </select>

      <input className={`${isSocketConnect ? 'block' : 'hidden'}`} type="file" accept="image/*" onChange={handleImage} />
    </div >
  );
}

export default ControlSection;