"""
    inbounds(xs::Tuple, data)

Check grid boundaries for a coordinate before writing in [`ManualRule`](@ref).

Returns a tuple containing the coordinate(s) followed by a boolean `true`
if the cell is in bounds, `false` if not.

Overflow of type [`RemoveOverflow`](@ref) returns the coordinate and `false` to skip
coordinates that overflow outside of the grid.

[`WrapOverflow`](@ref) returns a tuple with the current position or it's
wrapped equivalent, and `true` as it is allways in-bounds.

[`WallOverflow`](@ref) returns a tuple with the current position or 
the closest in-bounds position for coordinates that overflow outside of the grid,
 and `true` as it is allways in-bounds.
"""
@inline inbounds(xs::Tuple, data::SimData) = 
    inbounds(xs, first(data))
@inline inbounds(xs::Tuple, data::GridData) =
    inbounds(xs, gridsize(data), overflow(data))
@inline inbounds(xs::Tuple, maxs::Tuple, overflow) = begin
    a, inbounds_a = inbounds(xs[1], maxs[1], overflow)
    b, inbounds_b = inbounds(xs[2], maxs[2], overflow)
    (a, b), inbounds_a & inbounds_b
end
@inline inbounds(x::Number, max::Number, overflow::RemoveOverflow) =
    x, isinbounds(x, max)
@inline inbounds(x::Number, max::Number, overflow::WrapOverflow) =
    if x < oneunit(x)
        max + rem(x, max), true
    elseif x > max
        rem(x, max), true
    else
        x, true
    end

@inline inbounds(x::Number, max::Number, overflow::WallOverflow) =
    if x < oneunit(x)
        oneunit(x), true
    elseif x > max
        max, true
    else
        x, true
    end

"""
    isinbounds(xs::Tuple, data)

Check that a coordinate is within the grid, usually in [`ManualRule`](@ref).

Unlike [`inbounds`](@ref), [`Overflow`](@ref) status is ignored.
"""
@inline isinbounds(x::Tuple, data::Union{SimData,GridData}) = 
    isinbounds(x::Tuple, gridsize(data))
@inline isinbounds(xs::Tuple, maxs::Tuple) = all(isinbounds.(xs, maxs))
@inline isinbounds(x::Number, max::Number) = x >= one(x) && x <= max


#= Wrap overflow where required. This optimisation allows us to ignore
bounds checks on neighborhoods and still use a wraparound grid. =#
handleoverflow!(grids::Tuple) = map(handleoverflow!, grids)
handleoverflow!(griddata::GridData) = handleoverflow!(griddata, overflow(griddata))
handleoverflow!(griddata::GridData, ::RemoveOverflow) = griddata
handleoverflow!(griddata::GridData, ::WrapOverflow) = begin
    r = radius(griddata)
    r < 1 && return griddata

    # TODO optimise this. Its mostly a placeholder so wrapping still works in GOL tests.
    src = parent(source(griddata))
    nrows, ncols = gridsize(griddata)
    startpadrow = startpadcol = 1:r
    endpadrow = nrows+r+1:nrows+2r
    endpadcol = ncols+r+1:ncols+2r
    startrow = startcol = 1+r:2r
    endrow = nrows+1:nrows+r
    endcol = ncols+1:ncols+r
    rows = 1+r:nrows+r
    cols = 1+r:ncols+r

    # Left
    @inbounds copyto!(src, CartesianIndices((rows, startpadcol)),
                      src, CartesianIndices((rows, endcol)))
    # Right
    @inbounds copyto!(src, CartesianIndices((rows, endpadcol)),
                      src, CartesianIndices((rows, startcol)))
    # Top
    @inbounds copyto!(src, CartesianIndices((startpadrow, cols)),
                      src, CartesianIndices((endrow, cols)))
    # Bottom
    @inbounds copyto!(src, CartesianIndices((endpadrow, cols)),
                      src, CartesianIndices((startrow, cols)))

    # Copy four corners
    # Top Left
    @inbounds copyto!(src, CartesianIndices((startpadrow, startpadcol)),
                      src, CartesianIndices((endrow, endcol)))
    # Top Right 
    @inbounds copyto!(src, CartesianIndices((startpadrow, endpadcol)),
                      src, CartesianIndices((endrow, startcol)))
    # Botom Left
    @inbounds copyto!(src, CartesianIndices((endpadrow, startpadcol)),
                      src, CartesianIndices((startrow, endcol)))
    # Botom Right
    @inbounds copyto!(src, CartesianIndices((endpadrow, endpadcol)),
                      src, CartesianIndices((startrow, startcol)))

    wrapstatus!(sourcestatus(griddata))
end

function wrapstatus!(status)
    # This could be further optimised.
    status[end-1, :] .|= status[1, :]
    status[:, end-1] .|= status[:, 1]
    #status[end-2, :] .|= status[1, :] .|= status[2, :]
    status[end-2, :] .= true
    status[:, end-2] .|= status[:, 1] .|= status[:, 2]
    #status[1, :] .|= status[end-2, :] .|= status[end-1, :]
    status[1, :] .= true
    status[:, 1] .|= status[:, end-2] .|= status[:, end-1]
    status .= true
end

handleoverflow!(griddata::GridData, ::WallOverflow) = begin
    r = radius(griddata)
    r < 1 && return griddata

    # TODO optimise this. Its mostly a placeholder so wrapping still works in GOL tests.
    src = parent(source(griddata))
    nrows, ncols = gridsize(griddata)
    rows = 1+r:nrows+r
    cols = 1+r:ncols+r

    # Left
    @inbounds copyto!(src, CartesianIndices((rows, 1)),
                      src, CartesianIndices((rows, 1)))
    # Right
    @inbounds copyto!(src, CartesianIndices((rows, ncols)),
                      src, CartesianIndices((rows, ncols)))
    # Top
    @inbounds copyto!(src, CartesianIndices((1, cols)),
                      src, CartesianIndices((1, cols)))
    # Bottom
    @inbounds copyto!(src, CartesianIndices((nrows, cols)),
                      src, CartesianIndices((nrows, cols)))

    # Copy four corners
    # Top Left
    @inbounds copyto!(src, CartesianIndices((1, 1)),
                      src, CartesianIndices((1, 1)))
    # Top Right 
    @inbounds copyto!(src, CartesianIndices((1, ncols)),
                      src, CartesianIndices((1, ncols)))
    # Botom Left
    @inbounds copyto!(src, CartesianIndices((nrows, 1)),
                      src, CartesianIndices((nrows, 1)))
    # Botom Right
    @inbounds copyto!(src, CartesianIndices((nrows, ncols)),
                      src, CartesianIndices((nrows, ncols)))

    wrapstatus!(sourcestatus(griddata))
end