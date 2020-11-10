
function Base.show(io::IO, ruleset::Ruleset)
    printstyled(io, Base.nameof(typeof(ruleset)), " =\n"; color=:blue)
    println(io, "rules:")
    for rule in rules(ruleset)
        println(IOContext(io, :indent => "    "), rule)
    end
    for fn in fieldnames(typeof(ruleset))
        fn == :rules && continue
        println(io, fn, " = ", repr(getfield(ruleset, fn)))
    end
    ModelParameters.printparams(io, ruleset)
end

function Base.show(io::IO, rule::T) where T<:Rule{R,W} where {R,W}
    indent = get(io, :indent, "")
    printstyled(io, indent, Base.nameof(typeof(rule)), 
                "{", sprint(show, R), ",", sprint(show, W), "}"; color=:red)
    if nfields(rule) > 0
        printstyled(io, " :\n"; color=:red)
        for fn in fieldnames(T)
            if fieldtype(T, fn) <: Union{Number,Symbol,String}
                println(io, indent, "    ", fn, " = ", repr(getfield(rule, fn)))
            else
                # Avoid prining arrays etc. Just show the type.
                println(io, indent, "    ", fn, " = ", fieldtype(T, fn))
            end
        end
    end
end

function Base.show(io::IO, chain::Chain{R,W}) where {R,W}
    indent = get(io, :indent, "")
    printstyled(io, indent, string("Chain{", sprint(show, R), ",", sprint(show, W), "} :"); color=:green)
    for rule in rules(chain)
        println(io)
        print(IOContext(io, :indent => indent * "    "), rule)
    end
end
