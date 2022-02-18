export default help;
declare namespace help {
    const $help: string[];
    namespace reset {
        const $help_1: string[];
        export { $help_1 as $help };
    }
    namespace load {
        const $help_2: string[];
        export { $help_2 as $help };
        export namespace PDBID {
            const $help_3: string;
            export { $help_3 as $help };
        }
        export namespace URL {
            const $help_4: string;
            export { $help_4 as $help };
        }
        export namespace f {
            const $help_5: string[];
            export { $help_5 as $help };
        }
    }
    namespace clear {
        const $help_6: string;
        export { $help_6 as $help };
    }
    namespace add {
        const $help_7: string[];
        export { $help_7 as $help };
        export namespace REP_NAME {
            const $help_8: string;
            export { $help_8 as $help };
        }
        export { addRepDesc as DESCRIPTION };
    }
    namespace rep {
        const $help_9: string[];
        export { $help_9 as $help };
        export namespace REP_NAME_1 {
            const $help_10: string[];
            export { $help_10 as $help };
        }
        export { REP_NAME_1 as REP_NAME };
        export namespace REP_INDEX {
            const $help_11: string;
            export { $help_11 as $help };
        }
        export { addRepDesc as DESCRIPTION };
    }
    namespace remove {
        const $help_12: string[];
        export { $help_12 as $help };
        export namespace REP_NAME_2 {
            const $help_13: string[];
            export { $help_13 as $help };
        }
        export { REP_NAME_2 as REP_NAME };
        export namespace REP_INDEX_1 {
            const $help_14: string;
            export { $help_14 as $help };
        }
        export { REP_INDEX_1 as REP_INDEX };
    }
    namespace selector {
        const $help_15: string[];
        export { $help_15 as $help };
        export namespace EXPRESSION {
            const $help_16: string;
            export { $help_16 as $help };
        }
    }
    namespace mode {
        const $help_17: string[];
        export { $help_17 as $help };
        export { modeIdDesc as MODE_ID };
    }
    namespace color {
        const $help_18: string[];
        export { $help_18 as $help };
        export { colorDesc as COLORER_ID };
    }
    namespace material {
        const $help_19: string[];
        export { $help_19 as $help };
        export { materialDesc as MATERIAL_ID };
    }
    namespace build {
        const $help_20: string;
        export { $help_20 as $help };
        export namespace add_1 {
            const $help_21: string;
            export { $help_21 as $help };
            export namespace _new {
                const $help_22: string[];
                export { $help_22 as $help };
            }
            export { _new as new };
        }
        export { add_1 as add };
        export namespace del {
            const $help_23: string;
            export { $help_23 as $help };
        }
    }
    namespace list {
        const $help_24: string[];
        export { $help_24 as $help };
    }
    namespace hide {
        const $help_25: string[];
        export { $help_25 as $help };
    }
    namespace show {
        const $help_26: string[];
        export { $help_26 as $help };
    }
    namespace get {
        const $help_27: string[];
        export { $help_27 as $help };
        export { setGetParameterDesc as PARAMETER };
    }
    namespace set {
        const $help_28: string[];
        export { $help_28 as $help };
        export { setGetParameterDesc as PARAMETER };
    }
    namespace set_save {
        const $help_29: string[];
        export { $help_29 as $help };
    }
    namespace set_restore {
        const $help_30: string[];
        export { $help_30 as $help };
    }
    namespace set_reset {
        const $help_31: string[];
        export { $help_31 as $help };
    }
    namespace preset {
        const $help_32: string[];
        export { $help_32 as $help };
        export namespace PRESET {
            const $help_33: string[];
            export { $help_33 as $help };
        }
    }
    namespace unit {
        const $help_34: string[];
        export { $help_34 as $help };
    }
    namespace view {
        const $help_35: string[];
        export { $help_35 as $help };
        export namespace ENCODED_VIEW {
            const $help_36: string[];
            export { $help_36 as $help };
        }
    }
    namespace rotate {
        const $help_37: string[];
        export { $help_37 as $help };
    }
    namespace scale {
        const $help_38: string[];
        export { $help_38 as $help };
    }
    namespace select {
        const $help_39: string[];
        export { $help_39 as $help };
    }
    namespace within {
        const $help_40: string[];
        export { $help_40 as $help };
    }
    namespace url {
        const $help_41: string[];
        export { $help_41 as $help };
    }
    namespace screenshot {
        const $help_42: string[];
        export { $help_42 as $help };
    }
    namespace line {
        const $help_43: string[];
        export { $help_43 as $help };
    }
    namespace removeobj {
        const $help_44: string[];
        export { $help_44 as $help };
    }
    namespace listobj {
        const $help_45: string[];
        export { $help_45 as $help };
    }
}
declare namespace addRepDesc {
    const $help_46: string[];
    export { $help_46 as $help };
    export namespace s {
        const $help_47: string;
        export { $help_47 as $help };
    }
    export { modeIdDesc as m };
    export { colorDesc as c };
    export { materialDesc as mt };
}
declare namespace modeIdDesc {
    const $help_48: string[];
    export { $help_48 as $help };
    export namespace BS {
        const $help_49: string[];
        export { $help_49 as $help };
    }
    export namespace CA {
        const $help_50: string[];
        export { $help_50 as $help };
    }
    export namespace LN {
        const $help_51: string[];
        export { $help_51 as $help };
    }
    export namespace LC {
        const $help_52: string[];
        export { $help_52 as $help };
    }
    export namespace VW {
        const $help_53: string[];
        export { $help_53 as $help };
    }
    export namespace TR {
        const $help_54: string[];
        export { $help_54 as $help };
    }
    export namespace TU {
        const $help_55: string[];
        export { $help_55 as $help };
    }
    export namespace SA {
        const $help_56: string[];
        export { $help_56 as $help };
    }
    export namespace QS {
        const $help_57: string[];
        export { $help_57 as $help };
    }
    export namespace SE {
        const $help_58: string[];
        export { $help_58 as $help };
    }
    export namespace TX {
        const $help_59: string[];
        export { $help_59 as $help };
    }
}
declare namespace colorDesc {
    const $help_60: string[];
    export { $help_60 as $help };
    export namespace UN {
        const $help_61: string[];
        export { $help_61 as $help };
    }
}
declare namespace materialDesc {
    const $help_62: string[];
    export { $help_62 as $help };
}
declare namespace setGetParameterDesc {
    const $help_63: string[];
    export { $help_63 as $help };
    export { modeIdDesc as modes };
    export { colorDesc as colorers };
}
