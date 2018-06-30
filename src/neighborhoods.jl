"""
Neighborhoods define the behaviour towards the cells surrounding the current cell.
"""
abstract type AbstractNeighborhood end

"""
Radial neighborhoods calculate the neighborood in a loop from simple rules
base of the radius of cells around the central cell.
"""
abstract type AbstractRadialNeighborhood{T} <: AbstractNeighborhood end

"""
Radial Neighborhoods
"""
struct RadialNeighborhood{T,O} <: AbstractRadialNeighborhood{T}
    """
    The 'radius' of the neighborhood is the distance to the edge
    from the center cell. A neighborhood with radius 1 is 3 cells wide.
    """
    radius::Int
    "[`AbstractOverflow`](@ref). Determines how co-ordinates outside of the grid are handled"
    overflow::O
end 
"""
    RadialNeighborhood(;typ = :moore, radius = 1, overflow = Skip)
Radial neighborhood constructor with defaults.

typ may be :onedim, :moore, :vonneumann or :rotvonneumann
radius is an Int, and overflop is [`Skip`](@ref) or [`Wrap`](@ref).
"""
RadialNeighborhood(; typ=:moore, radius=1, overflow=Skip()) =
    RadialNeighborhood{typ, typeof(overflow)}(radius, overflow)

"""
Custom neighborhoods are tuples of custom coordinates in relation to the central point
of the current cell. They can be any arbitrary shape or size.
"""
abstract type AbstractCustomNeighborhood <: AbstractNeighborhood end

"""
Allows completely arbitrary neighborhood shapes by specifying each coordinate
specifically.
"""
struct CustomNeighborhood{H,O} <: AbstractCustomNeighborhood
    """
    A tuple of tuples of Int (or an array of arrays of Int, etc),
    contains 2-D coordinates relative to the central point
    """
    neighbors::H
    "[`AbstractOverflow`](@ref). Determines how co-ordinates outside of the grid are handled"
    overflow::O
end

"""
Sets of custom neighborhoods that can have separate rules for each set.
"""
struct MultiCustomNeighborhood{H,O} <: AbstractCustomNeighborhood
    """
    A tuple of tuple of tuples of Int (or an array of arrays of arrays of Int, etc),
    contains 2-D coordinates relative to the central point.
    """
    multineighbors::H
    "A vector the length of the base multineighbors tuple, for intermediate storage"
    cc::Vector{Int8}
    "[`AbstractOverflow`](@ref). Determines how co-ordinates outside of the grid are handled"
    overflow::O
end
MultiCustomNeighborhood(mn) = MultiCustomNeighborhood(mn, zeros(Int8, length(mn)))


"""
    neighbors(hood::AbstractNeighborhood, state, index, t, source, args...)
Checks all cells in neighborhood and combines them according
to the particular neighborhood type.
"""
function neighbors end

"""
    neighbors(hood::AbstractRadialNeighborhood{:onedim}, state, index, t, source, args...)
Sums single dimension radial neighborhoods. Commonly used by Wolfram.
"""
neighbors(hood::AbstractRadialNeighborhood{:onedim}, state, index, t, source, args...) = begin
    width = size(source)
    r = hood.radius
    # Initialise minus the current cell value, as it will be added back in the loop
    cc = -source[index]
    # Sum active cells in the neighborhood
    for p = (index - r):(index + r)
        p = bounded(p, width, hood.overflow)
        cc += source[p]
    end
    cc
end

"""
    neighbors(hood::AbstractRadialNeighborhood, state, index, t, source, args...)
Sums 2-dimensional radial Nieghborhoods. Specific shapes like Moore and Von Neumann
are determined by [`inhood`](@ref), as this method is general.
"""
neighbors(hood::AbstractRadialNeighborhood, state, index, t, source, args...) = begin
    height, width = size(source)
    row, col = index
    r = hood.radius
    # Initialise minus the current cell value, as it will be added back in the loop
    cc = -source[row, col]
    # Sum active cells in the neighborhood
    for q = (col - r):(col + r), p = (row - r):(row + r)
        p, q, is_inbounds = inbounds((p, q), (height, width), hood.overflow)
        is_inbounds && inhood(hood, p, q, row, col) || continue
        cc += source[p, q]
    end
    cc
end

"""
    neighbors(hood::AbstractCustomNeighborhood, state, index, t, source, args...)
Sum a single custom neighborhood.
"""
neighbors(hood::AbstractCustomNeighborhood, state, index, t, source, args...) =
    custom_neighbors(hood.neighborhood, hood, index, t, source, args...)

"""
    neighbors(hood::MultiCustomNeighborhood, state, index, t, source, args...)
Sum multiple custom neighborhoods separately.
"""
neighbors(hood::MultiCustomNeighborhood, state, index, t, source, args...) = begin
    for i = 1:length(hood.multineighbors)
        mn.cc[i] = custom_neighbors(hood.multineighbors[i], hood, index, t, source)
    end
    mn.cc
end

custom_neighbors(n, hood, index, t, source) = begin
    height, width = size(source)
    row, col = index
    # Initialise to empty
    cc = zero(eltype(source))
    # Sum active cells in the neighborhood
    for (a, b) in n
        p, q, is_inbounds = inbounds((a + row, b + col), (height, width), hood.overflow)
        is_inbounds || continue
        cc += source[p, q]
    end
    cc
end

"""
    inhood(n::AbstractRadialNeighborhood{:moore}, p, q, row, col)
Check cell is inside a Moore neighborhood. Always returns `true`.
"""
inhood(n::AbstractRadialNeighborhood{:moore}, p, q, row, col) = true
"""
    inhood(n::AbstractRadialNeighborhood{:vonneumann}, p, q, row, col)
Check cell is inside a Vonn-Neumann neighborhood, returning a boolean.
"""
inhood(n::AbstractRadialNeighborhood{:vonneumann}, p, q, row, col) =
    (abs(p - row) + abs(q - col)) <= n.radius
"""
    inhood(n::AbstractRadialNeighborhood{:rotvonneumann}, p, q, row, col)
Check cell is inside a Rotated Von-Neumann neighborhood, returning a boolean.
"""
inhood(n::AbstractRadialNeighborhood{:rotvonneumann}, p, q, row, col) =
    (abs(p - row) + abs(q - col)) > n.radius
